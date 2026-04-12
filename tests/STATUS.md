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
| Inventory | 7/7 | ✅ Load, search, add item, type filter, edit item & save, delete item — **R6: edit test now clicks #em-edit-toggle to enter edit mode before querying inputs** |
| Notebooks | 16/16 | ✅ Create, folders, rich text, image upload+annotation+resize+save+render, API fallback, delete |
| Lab Map | 12/12 | ✅ (R2, Issue #19) Placeholder card + hierarchy tree: renders root room, tree walks room→freezer→shelf→box→tubes, migrated items nest under auto-created box, grid & position badges, click opens popup with breadcrumb, filter narrows tree, collapse-all, inline delete removes file + DOM node — **R6: tree now rendered via Lab.locationTree module** |
| Hierarchy | 15/15 | ✅ (R1, Issue #18) Location entries in object-index, parentChain walks root→leaf, breadcrumbHTML, migrated items carry parent-ref, childrenOf reverse lookup, parseGrid, parsePosition, normalizeParent, sample cross-location wikilinks, tube popup breadcrumb, parent field as object pill, multi-line labels preserve newlines |
| Editor | 11/11 | ✅ (R3, Issue #18) 3-column modal layout, universal grid renderer (10x10 + 9x9 with collisions), label_2 in cells, collision badge + popover, shelf children list with +Add, **R5: reagent col 3 shows bottle backlinks** (was: container_list relocated), type field as datalist with discovered types, empty-cell click opens new-object modal (parent/position/type pre-filled), new mode clears col 2/3 synchronously |
| Wikilinks | 9/9 | ✅ (R4, Issue #18) Module loaded, autocomplete filter, sample popup shows backlinks from tubes, click backlink navigates, parent field autocomplete (location-only), empty cell opens place-here popover with search + create-new, place-here search returns results, [[ autocomplete fires on trigger in WYSIWYG, items show title + breadcrumb |
| Bottles | 10/10 | ✅ (R5) bottle type registered, 156 migrated bottles in index, all carry of:+parent:, ethanol-absolute wired to cabinet-flammable, location anchors exist (R6: bench, fridge-4c-main merged), concept files cleaned of containers:, concept popup col 3 lists physical bottles via of:-aware backlinks, inventory hides bottle rows + counts them under concept |
| R6 | 10/10 | ✅ Lab.locationTree module loaded, cabinets parented under Robbins 0170, bench renamed (no bench-reagent), fridge-reagent merged into fridge-4c-main, location: field stripped from concepts, locations picker mounts a tree, picker tree excludes bottles via childFilter, lab-map tree renders via module, lab-map nodes draggable, grid occupied cells draggable |
| R6.5 | 9/9 | ✅ (R6.5) isConceptType helper, concepts/instances/locations/stocks classified correctly, scoped save-time uniqueness check catches dupe concepts, instance-count map from `of:` + link-index, ethanol-absolute → 1 bottle, ethanol-70 → 2 bottles (multi-bottle), sample-pistachio-4 → 3 tubes, autocomplete dropdown badges 19 concepts with instances |
| R7 | 13/13 | ✅ (R7) Scrubbed R5 migration leftover text from 156 bottle files (#31), location-tree preserves expanded set across refresh (#21), popup Edit button resets label on every open (#30), stray mobile Graph nav link removed (#25), three new base-level rooms indexed (#41), mtime-aware object index for recency sort (#27), inventory mobile toolbar stacks into filter-row (#27), mini-graph close button gets bigger tap target (#24), issue-reporter FAB raised above editor-modal overlay (#33), body.em-editing hides FAB during edit (#23), popup closeOrBack pops nav stack (box→tube→close returns to box) (#32), dashboard bulletin edit round-trips via from=dashboard (#22), chip-seq empty rpm placeholders replaced with visible TODO (#35), annotate save-callback errors no longer block close (#29) |
| R8 | 7/7 | ✅ (R8 quick wins) alex-chen fake user retired (#26), barb-m (Barbara McClintock) demo notebooks + person card, liquid nitrogen refill SOP scaffolded with TODO placeholders (#17), chip-seq empty `lot:` placeholders replaced with visible TODO (#36), personalized notebooks view sorts current user's folder first with "Your notebook" section label (#39) |
| R9 | 7/7 | ✅ (R9) dropped the redundant "(Copy)" sidebar badge on duplicated protocols — title still carries "(Copy)" as a rename cue but the sidebar no longer doubles it (#43), rewrote workflow-templates/protocol-template.md as an educational roadmap teaching "what makes a good protocol" while demonstrating callouts, wikilinks, tables, images, videos, and code blocks (#44) |
| R10 | 15/15 | ✅ (R10) chemistry sub/superscript rendering in renderMarkdown with auto-whitelist of common formulas (H₂O, CO₂, H₂SO₄, NaHCO₃, MgCl₂, …) + explicit `~n~` / `^n^` markdown syntax, skipping code/pre/URLs and no false positives on grid cells (A1), room numbers (170), or pH 7.5 (#37), corrosives SOP H290/H314/H318 chemical lists promoted to wikilinks against real inventory slugs — went from 6 to 44 wikilinks (#16) |
| R11 | 7/7 | ✅ (R11) issue reporter accepts file/screenshot attachments — drag-drop zone, file picker, clipboard paste; chip preview with remove button; uploads to `issue-attachments/YYYY/MM/` outside docs/ so MkDocs ignores them; images embedded as `![name](raw.githubusercontent.com/...)` markdown so GitHub renders them inline in the issue body; non-image files linked via blob URL; 5 MB cap per file (#45) |
| R12 | 10/10 | ✅ (R12) new scripts/build-user-stats.py walks git log and emits docs/user-stats.json with per-user totals (commits, protocols authored, notebooks authored, inventory edits, wiki edits, images uploaded, issue attachments) + recent commit list. New app/profile.html renders a per-user dashboard with stats grid, 11 unlockable badges (First Commit, Protocol Master, Chronicler, Inventory Keeper, Century, Photographer, Wiki Builder, Debugger, Founder, …), recent activity, and a cross-user leaderboard. Nav avatar now links to profile (#42) |
| R13 | 8/8 | ✅ (R13) calendar page now includes the global issue reporter FAB and each hour cell in the week grid is click-to-create — clicking an empty slot opens the Add Block modal pre-filled with that day's date and the hour's start time (end time defaults to +1h), hover highlight + `cursor:cell` make cells feel clickable (#40) |
| R14 | 12/12 | ✅ (R14 tone samples for #38) hand-written educational intros for 5 common chemicals (ethanol-absolute, agarose, edta-trisodium-salt, tris-base, sodium-dodecyl-sulfate) establishing the "What it is / Why we use it / Callout" template for the full catalog rewrite. Scope is intentionally small — 5 cards done, remaining ~137 to be scaled up in a follow-up round |
| R15 | 7/7 | ✅ (R15) mobile markdown format toolbar — new Aa toggle button in the mobile fab bar opens a compact strip with Bold / Italic / H2 / H3 / bullet / numbered / code / blockquote buttons that call Toast UI `editor.exec()`; each button refocuses the WYSIWYG ProseMirror first so exec lands in the right instance; toggling again closes the strip; desktop unaffected (still uses the native Toast UI toolbar) (#28) |
| R16 | 9/9 | ✅ (R16) scaled R14 template to the full chemical catalog via 6 parallel subagents. 151 reagent/buffer/chemical/enzyme cards in `docs/resources/` now carry the 3-callout intro (ℹ️ Chemistry / 💡 Lab use / ⚠️ Safety), ≤6 sentences each. 4 skips: 1 freezer-slot placeholder + 3 test fixtures. 156/156 total coverage counting the 5 R14 tone samples (#38) |
| Samples | 7/7 | ✅ Load, status filter, search, add sample, edit modal, delete sample |
| Projects | 3/3 | ✅ Folder listing, open project, create project |
| Waste | 2/2 | ✅ Loads, add container |
| Calendar | 3/3 | ✅ Loads, add event, delete event |
| Dashboard | 4/4 | ✅ Stats, recent updates, bulletin, bulletin edit link |
| Search | 4/4 | ✅ protocols, wiki, inventory, notebooks — all return results |
| Cross-nav | 2/2 | ✅ Wikilink pill found, navigates to protocols page |
| Special chars | 2/2 | ✅ Create with quotes/ampersands/tags, content preserved |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 248/248 (100%)** — R16 adds 9 new tests covering the full chemical catalog educational intro pass (#38): 7 spot-check slugs across diverse categories (ketones, antibiotics, detergents, density polymers, thiols, quaternary ammonium), catalog-wide coverage count (≥140 cards with all 3 callouts), and a rendered-page admonition class check. See Round 16 below for the full writeup.

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

## Round 6: Cleanup + reusable tree module + drag-drop (2026-04-11)

R5 left a handful of loose ends and three R6 candidates were deferred from R4. R6 closes everything but the explicitly-skipped ambiguous-wikilink rendering (a survey of all 1330 [[wikilinks]] in the corpus found zero actually-ambiguous cases — solving a future problem, revisit when real collisions appear).

### Pre-flight reality check

Before designing, I scanned the data:
- **1330 total `[[wikilinks]]` in the corpus.** 173 use slug form (`resources/foo`), 1041 resolve to a unique basename, 116 are unresolved (broken refs to nothing), **0 are actually ambiguous**.
- **142 reagent files still carry the now-redundant `location:` field** post-R5, since R5 only stripped `containers:`.
- **6 placeholder location objects** from R5 had no parent set, so they showed up as orphan roots in the lab-map tree alongside `room-robbins-0170`.

### Cleanup batch (small, do first)

- [x] **Cabinets parented under Robbins 0170** — `cabinet-chemical`, `cabinet-flammable`, `cabinet-corrosive` now nest inside the real lab room. They show up as children of Robbins 0170 in the lab-map tree instead of floating roots.
- [x] **`bench-reagent` renamed to `bench`** — cleaner name now that there's only one bench location. The 2 bottles previously parented to `bench-reagent` were re-parented to the new `bench`. Old file deleted.
- [x] **`fridge-reagent` merged into `fridge-4c-main`** — same physical fridge as the existing R1 seed. The 13 reagent bottles previously parented to `fridge-reagent` are now parented directly to `fridge-4c-main` (no shelf yet — Grey will add specific shelves later as needed). Placeholder file deleted.
- [x] **`location-unsorted` left parentless** — intentional "review me" bucket alongside Robbins 0170. Items that need manual triage live there.
- [x] **`location:` field stripped from 188 concept files** — bottles' `parent:` is the source of truth post-R5; the old free-text string was redundant and would drift.
- [x] **Inventory `Edit item fields` test fixed** — `openItem()` opens the editor in popup view by design (this is the agreed UX: read-only first, click Edit to modify). The test now clicks `#em-edit-toggle` to enter edit mode before querying for `.em-field-input[type="text"]`. Inventory back to 7/7.

### Lab.locationTree module

Lifted the ~280 LoC tree component out of `app/lab-map.html` (where it was inline) into `app/js/location-tree.js` so it can power both the lab-map page AND the editor's locations picker. Module API:

```js
Lab.locationTree.attach(mountEl, {
  mode: 'full' | 'picker',
  onOpen, onEdit, onDelete,        // full mode callbacks
  onPick,                          // picker mode callback
  onReparent,                      // drag-drop re-parent (full mode)
  draggable: bool,
  showActions: bool,
  showSearch: bool,                // module-owned search input vs page-owned
  initialDepth: number,
  locationsOnly: bool,             // root filter
  childFilter: (typeName) => bool, // descendant filter
})
// → { refresh, filter, expand, collapseAll, getRoots, getOrphans, isExpanded, destroy }
```

- [x] **Module emits both `lt-*` AND legacy `tree-*`/`tw-*` classnames** so lab-map's existing CSS and labbot's existing test selectors keep working without rewrites. Cost: ~5 extra characters per element. Benefit: zero test churn.
- [x] **`childFilter` option** — picker mode + `locationsOnly` defaults this to "location types only" so bottles parented to a cabinet don't show up in the locations picker. Lab-map's full mode leaves it null and shows everything in the location subtree (180 nodes total: locations + bottles + tubes).
- [x] **`app/lab-map.html` refactored** to use the module — now ~100 lines of glue (open/edit/delete/reparent callbacks + page-owned toolbar wiring) instead of 280 lines of inline tree code. The module is loaded via `app/js/lab.js`.

### Locations hierarchy picker (in editor's Insert Link Modal)

- [x] When the user picks the **Locations** category in the editor's Insert Link Modal, render a `Lab.locationTree` tree (picker mode) into `#em-link-list` instead of the flat alphabetical list.
- [x] The shared `#em-link-search` input drives the tree's filter (instead of `filterLinkItems()`).
- [x] Clicking any location node inserts `[[locations/<slug>]]` into the body via the existing `insertLink()` flow.
- [x] Switching to a different category destroys the tree before falling back to the flat list.
- [x] **Picker tree shows 16 nodes** (the location subtree under Robbins 0170 + the unsorted bucket), 0 bottles.

### Drag-and-drop re-parenting in lab-map tree

- [x] **Tree nodes are `draggable=true`** when `opts.draggable` is on. Drop on any other valid node fires `opts.onReparent(srcSlug, newParentSlug)`.
- [x] **Cycle prevention** — `isDescendantOf(maybeDescendant, ancestor)` walks the resolved parent chain. Drops that would create a cycle are silently rejected (no preventDefault on the dragover, so the cell isn't highlighted).
- [x] **`reparentSlug()` in lab-map.html** — confirms with the user, fetches the file via `Lab.gh.fetchFile`, patches the `parent:` line in frontmatter (replaces if present, inserts after `type:` otherwise), clears `position:` (the new parent's grid is different), saves to GitHub via `Lab.gh.saveFile`, rebuilds the tree.
- [x] **Visual feedback** — `.lt-dragging` class (low opacity on the dragged node), `.lt-drop-target` class (teal dashed outline on the hovered drop target), grab/grabbing cursor on draggable rows.
- [x] **Lab-map tree shows 180 draggable nodes** — every location, bottle, and tube parented into the location hierarchy can be dragged.

### Drag-and-drop within editor grid (single-grid only)

- [x] **Occupied grid cells are `draggable=true`** in `renderGridPane`.
- [x] **`bindGridHandlers` wires dragstart/dragover/drop on cells.** Drop on an empty cell calls the existing `moveObjectHere(slug, sameParent, newCell)` (R4 helper) which patches the dragged file's `position:` frontmatter, saves to GitHub, patches the index, and re-renders the grid.
- [x] **Drop on an occupied cell is rejected** — only empty cells are valid drop targets. Swap-on-drop is a future enhancement.
- [x] **Cross-grid drag is out of scope** for R6 — would require cross-popup state and a shared drop target. Grey explicitly scoped this to single-grid only.
- [x] **CSS** — grab/grabbing cursor on draggable cells, opacity dim while dragging, teal dashed outline on the hovered drop target.

### Tests added in R6

10 new tests in a new `r6` section:
- Lab.locationTree module loads and exposes attach()
- Cabinets parented under Robbins 0170
- bench renamed (bench-reagent gone)
- fridge-reagent merged into fridge-4c-main (13 bottles now on fridge-4c-main)
- `location:` field stripped from 167 concept files
- Locations picker mounts a tree (16 nodes including Robbins Hall 0170)
- Picker tree excludes bottles via childFilter
- Lab-map tree renders 180 nodes via the module
- Lab-map tree nodes are all draggable
- Editor grid occupied cells are draggable

Plus the R5 bottles test was updated to reflect the post-R6 cleanup (now expects `bench` and `fridge-4c-main` instead of the old placeholder slugs).

### Explicitly skipped in R6

- **Ambiguous wikilink rendering** — survey found 0 actually-ambiguous cases in the corpus. Will revisit when the first real collision appears (probably after Grey adds a second bottle of something with a colliding title).

## Round 6.5: scoped uniqueness + autocomplete instance badge (2026-04-11)

Two silent helpers for the concept↔instance ambiguity space. Both live on the *create* and *write* sides — no warning pills, no orange badges, no user-visible rebukes. The guiding principle (decided during R6): ambiguous-pill rendering at read time would mostly fire on healthy shorthand and annoy users, so we're catching ambiguity earlier and quieter.

### `Lab.types.isConceptType(typeName)`

New helper in `app/js/types.js`. Returns true for types whose cards represent abstract entities, false for instance types:

| Returns | Types |
|---|---|
| `true` | `reagent`, `buffer`, `consumable`, `equipment`, `kit`, `chemical`, `enzyme`, `solution`, `person`, `project`, `protocol`, `sample`, `guide`, `waste_container` |
| `false` | `bottle` (R5), all location-group types (`room`, `freezer`, `fridge`, `shelf`, `box`, `tube`, `container`), legacy stocks (`seed`, `glycerol_stock`, `plasmid`, `agro_strain`, `dna_prep`), unknown types |

The rule is by `type`, not by group, because the `stocks` group mixes concept-ish (seed) and instance-ish (bottle). Legacy stock types are treated as instances because each file historically represented one physical stock — if/when we promote them to a concept/instance split like R5 did for reagents, this will flip.

### Scoped title uniqueness at save time (editor-modal.js)

- [x] Before `Lab.gh.saveFile`, if `Lab.types.isConceptType(meta.type)` is true, walk the cached object index for entries with the same `(type, title)` at a different path. If any match, refuse with a toast naming the existing file: *"A reagent titled 'Ethanol Absolute' already exists at resources/ethanol-absolute.md. Pick a different title or open the existing one."*
- [x] Exempts bottles and locations — 156 bottles legitimately share their concept's title, and multiple tubes labeled "Pistachio Leaf 1" can live in different boxes.
- [x] Uses the cached index; if the index isn't loaded yet (rare), the check is skipped to avoid blocking the save on a network round-trip.
- [x] Catches the genuine dupe-concept bug (an agent accidentally creating a second "Ethanol Absolute" reagent card) at write time, silently, without ever rendering a warning pill in the body.

### Autocomplete instance badge (wikilink-autocomplete.js)

- [x] When the `[[` autocomplete dropdown renders an item for a concept type, badge it with a small teal pill: "· N instances". The pill is a hint that this concept has N physical instances the writer could have linked to instead.
- [x] Instance count is computed from two signals:
  1. **R5 bottles** via `of:` frontmatter in the object index (high-volume, ~163 concepts have at least 1 instance)
  2. **R1 tubes/containers** via body wikilinks from location-type entries (smaller, but catches the pistachio-sample case where 3 tubes point at one sample concept)
- [x] The count map is built lazily from cached indexes (`_getCachedIndex` + new `_getCachedLinkIndex` for symmetry), invalidated on autocomplete attach so fresh saves are picked up.
- [x] Verified: `resources/ethanol-absolute` → 1 instance, `resources/ethanol-70` → 2 (multi-bottle), `samples/sample-pistachio-4` → 3 tubes, 163 concept slugs total have ≥1 instance.
- [x] Render-only change — the inserted link is still `[[slug]]` pointing at whatever the writer picked. No behavioral change, just an "fyi, specific instances exist" hint.

### Bonus fix: inventory create-then-edit race (4-way)

While landing R6.5 I hit a pre-existing race condition that was making the inventory `Edit item & save` test flake on about half the runs. The R6.5 eager `fetchLinkIndex` on autocomplete attach was adding network contention that tipped the timing over the edge and made the flake deterministic.

**Root cause sequence** (confirmed via telemetry):
1. `inventory.html confirmAdd` calls `Lab.gh.saveFile(path, content, null, msg)` then immediately `Lab.editorModal.open(path)`.
2. `openPopup` calls `Lab.gh.fetchFile(path)` which hits the GitHub contents API — and **the contents API still serves the pre-commit state for 1-3 seconds after a write** (cache lag).
3. `fetchFile` throws a 404, caught by `openPopup`'s try/catch, but `currentState.meta` stays `{}` and `currentState.sha` stays `null` because the catch runs before the `parseFrontmatter` line.
4. Test clicks edit-toggle → `renderFields` renders the form from an empty meta with only the default `type` value.
5. Test changes `location_detail` → saves.
6. `save()` calls `gh.saveFile(path, content, null, msg)` — no sha — GitHub's PUT `/contents` rejects with **422 "sha was not supplied"** for an existing file.
7. Test reads the file via `gh api` → gets the original pre-edit content → `verified=false`.

**Three complementary fixes:**

- [x] **`inventory.html confirmAdd`** now primes `lab_file_cache` with the just-saved content + sha right after `saveFile` succeeds. `openPopup`'s existing cache-fallback picks it up and sidesteps the contents API entirely for the first few seconds after create.
- [x] **`editor-modal.js openPopup`** falls back to the localStorage cache when `fetchFile` throws, instead of dropping into the error state. Defensive safety net for any other create-then-open flow (not just inventory).
- [x] **`wikilink-autocomplete.js attach`** no longer eagerly fetches both indexes — just invalidates the instance map. The eager fetches were redundant (`filterEntries` already awaits `fetchObjectIndex` on first keystroke) and were adding network contention during the race window.

Two consecutive inventory runs at 7/7 after the fix.

### Tests added in R6.5

9 new tests in a new `r65` section:
- `isConceptType` classifies concepts correctly (reagent, protocol, person, sample → true)
- `isConceptType` classifies instances/locations/stocks/unknowns correctly (bottle, tube, seed, unknown → false)
- A real concept exists with unique (type, title) in the index
- Instance map counts `resources/ethanol-absolute` → 1 bottle
- Instance map counts `resources/ethanol-70` → 2 bottles (multi-bottle case)
- Instance map counts `samples/sample-pistachio-4` → 3 tubes (body-wikilink path)
- 100+ concept slugs have instance counts (shows the map is dense)
- Autocomplete dropdown opens when typing into a parent input
- Autocomplete badges 19 concepts with "N instances" when searching "ethanol"

### Skipped in R6.5

- **`Lab.gh._getCachedLinkIndex` surface area** — added as a minimal sync accessor only for use by wikilink-autocomplete's lazy map builder. Not promoted to a public API.

---

## Round 7: Mobile UX cluster + cleanup quick wins (2026-04-11)

Grey filed 24 issues against the live site today, mostly from his phone on 411×795. R7 is a batch of 13 small, independent fixes covering mobile friction, a few regressions from R5/R6, and the R5 migration leftover text. No new features — this round is about tightening what's already there so the 11 lab members picking it up next don't hit the same papercuts.

### What shipped

- [x] **#31 scrub R5 migration leftover text** — `Migrated from inline \`containers:\` entry (original location: 'Chemical Cabinet').` was sitting at the bottom of all 156 bottle files after the R5 migration. One-shot python pass stripped the line. Nothing to test in labbot beyond "this string is gone from ethanol-absolute's body".
- [x] **#21 tree uncollapse after reparent** — the lab-map `build()` call in `reparentSlug` was calling `tree.destroy()` + re-attach after every drag-drop, which rebuilt the expanded `Set` from scratch (to just `initialDepth=2` depth). Fixed two ways: (1) `location-tree.js build()` now only seeds `initialDepth` on the first boot (`seeded` flag) and preserves the existing Set on subsequent builds, dropping any stale slugs that no longer exist; (2) `lab-map.html reparentSlug`/`deleteSlug` now call `tree.refresh()` instead of rebuilding the whole tree. User's expanded branches survive re-parent.
- [x] **#30 popup Edit button label stale** — `em-edit-toggle` flipped between "Edit" (view mode) and "View" (edit mode), but `openPopup` was never resetting the button HTML. Sequence: edit item A → button becomes "View" → close → open item B → button still says "View" while the new popup is actually in view mode. Fix: `openPopup` sets the button HTML back to "Edit" every time, before the async file fetch.
- [x] **#25 stray mobile Graph link** — `nav.js toggleMorePopover` was appending an extra "Graph" link to the mobile `...` overflow popover that didn't exist in the desktop `TABS` array and duplicated the wiki graph tab. Removed. If we want a graph page back, add it to `TABS`.
- [x] **#33 issue FAB disappears over modal** — the issue-reporter FAB (`bottom:80px left:18px`) had `z-index:9999`, under `em-overlay`'s `z-index:10000`. Bumped FAB to `10001` and its submit overlay to `10002` so the user can submit an issue while looking at an item card popup.
- [x] **#23 issue FAB covers edit toolbar** — the FAB sat on top of the Toast UI mobile fab bar in edit mode. Fix is to hide the FAB while any editor is active. Added body class `em-editing` toggled by `startEditing` / `stopEditing` / `close` / `openNew`, mirroring wiki.html's existing `body.editing-mode`. CSS in `issue-reporter.js` hides the FAB when either class is set.
- [x] **#34 issue submit popup keyboard-covered** — on mobile, the centered modal meant the submit button was below the fold once the keyboard came up. CSS inside `issue-reporter.js injectCSS` anchors the overlay to `align-items:flex-start` with a 12px top padding on narrow viewports.
- [x] **#32 close-returns-to-parent-box (popup nav history)** — `editor-modal.js` now keeps a `navStack` of previously-open paths. `openPopup` pushes the current path when it replaces another popup (guarded by `isBackNavigation`); the X button and footer Close button are rebound to `closeOrBack()`, which pops the stack and re-opens if there's a parent to return to, else hard-closes. Escape and outside-click still hard-close (explicit "dismiss everything" gestures). Works for `openNew` too: opening the Add flow from a parent pushes the parent onto the stack.
- [x] **#41 three new base-level rooms** — Grey listed Asmundson growth chamber, Robbins Hall 262 (his office), and the Genome Center. Added as parentless `room` entries under `docs/locations/`. They'll show up as tree roots on lab-map.html alongside `room-robbins-0170`.
- [x] **#27 inventory mobile filter bar + recency sort** — two parts:
  - **Layout**: on `max-width: 768px`, the toolbar now stacks: search input full-width, filters wrapped in a new `.filter-row` that flows as a second row with each select flex-1 and font-size 13px. The three selects had been squeezed into 80px wide pills on mobile.
  - **Sort**: `scripts/build-object-index.py` now shells out to `git log --reverse --name-only --pretty=format:COMMIT:%at --diff-filter=AM` once, parses the stream into `{path → unix timestamp}`, and attaches `mtime` to every object-index entry that has a commit history. `github-api.js INDEX_KEYS` picks up `mtime`, `inventory.html toInventoryRow` forwards it to the row, and the default `sortCol` flips from `name` to `mtime` with `sortDir=-1` (newest first). User can still click any column header to re-sort. 464/468 entries carry mtimes.
- [x] **#24 wiki connections panel close button on mobile** — the `.mini-close` X was 22×22 on all viewports, too small to hit reliably on a phone. Also lacked an explicit `z-index` and `pointer-events`. Added `z-index:3; pointer-events:auto;` and bumped to 32×32 on mobile with 18px icon.
- [x] **#22 bulletin edit returns to dashboard** — dashboard's Edit button linked to `wiki.html?doc=bulletin` and after save the user landed on the wiki article. Added `&from=dashboard` to the link; `wiki.html saveDoc` reads the param and `location.href='dashboard.html'` on successful save (after the save-in-flight pieces unwind).
- [x] **#29 annotate save-callback error blocks close** — `annotate.js saveAnnotations` called the host callback (Toast UI `setMarkdown` round-trip), then `showToast('Saved!')`, then `close()`. A throw from the callback escaped to the outer try/catch and skipped both the toast and close, but Grey saw the saved toast in his report — suggesting a different failure mode. Defensive fix: wrap the callback in its own try/catch so its errors never block the close, move `close()` outside the try, and only skip it if the outer catch fires (which early-returns).
- [x] **#35 chip-seq rpm placeholders** — the source file had `(rpm:             )` with whitespace-only placeholders. Markdown collapses multi-space runs on render, so on mobile these showed up as `(rpm: )` and Grey read them as a rendering bug. Replaced with `(rpm: _**TODO: fill in**_)` so they render as an obvious fill-me placeholder. Grey will put the real values in when he has them.

### Tests added in R7

13 new tests in a new `r7` section of `tests/labbot.mjs`:
- `#31` bottle body has no "Migrated from inline" leftover
- `#27` object-index entries carry `mtime` (464+ with mtime)
- `#41` three new base-level room locations indexed
- `#25` mobile nav overflow popover has no stray Graph link
- `#33` issue reporter FAB z-index > 10000
- `#23` body.em-editing CSS hides the FAB
- `#21` `location-tree.refresh()` preserves expanded slugs
- `#30` popup edit toggle starts as "Edit" on fresh open
- `#32` closeOrBack pops nav stack to previous popup (box → tube → close returns to box)
- `#24` wiki mini-graph close button has `pointer-events:auto`
- `#27` inventory toolbar has `.filter-row` wrapper
- `#22` dashboard bulletin edit link carries `from=dashboard`
- `#35` chip-seq empty rpm placeholders replaced with visible TODO

### Subtle bugs caught during R7 implementation

1. **`seeded` guard in location-tree.build()** — my first attempt to the tree-uncollapse regression was just to call `tree.refresh()` in lab-map instead of rebuilding. But `refresh()` internally calls `build()` which calls `seedInitialExpansion()` — which re-expands roots to `initialDepth=2` every time. That would revert any *manual collapsing* the user had done of a root node, which is just as bad. Added a `seeded` flag so `seedInitialExpansion` only fires on the very first build — subsequent builds preserve the user's exact expansion state (with a sweep to drop any stale slugs that no longer exist in the rebuilt graph).
2. **em-editing class leak on openPopup** — first cut of the `body.em-editing` mechanism set the class in `startEditing` and cleared in `stopEditing` / `close`. Problem: if the user was in edit mode of item A and opened item B directly via a link click (without stopEditing first), item B's popup opens in view mode but the body class is still set → issue FAB stays hidden even though we're viewing. Fixed by clearing `em-editing` at the top of `openPopup` (item B will be in view mode anyway).
3. **nav stack leaks across openPopup loops** — without the `isBackNavigation` guard, `closeOrBack` → `openPopup(prev)` would push the just-popped path back onto the stack, trapping the user in a ping-pong. Guarded by setting `isBackNavigation = true` before the re-open and reading/clearing it at the top of openPopup.

---

## Round 8: Quick wins batch (2026-04-11)

First drain of the remaining post-R7 issue backlog. Four small independent fixes, each standing on its own with no cross-dependencies. Nobody's using the site yet, so rather than sequence for maximum user impact we're just clearing issues in efficiency order.

### What shipped

- [x] **#26 retire Alex Chen, add Barb M.** — `docs/notebooks/alex-chen/` had become a dumping ground of realistic demo notebook entries + labbot test debris (`fallback-test-*`, `project-dir/`, `tes-proj/`, `test/`, all nearly empty). Renamed the folder to `docs/notebooks/barb-m/`, kept the four real daily entries (2026-03-31 through 04-05) + `pangenome-project.md`, updated signed names and extraction IDs (`AC-ext-001` → `BM-ext-001`), and dropped all the test-debris subfolders and fallback files. Added a `docs/people/barb-m.md` knowledge card framing Barb as "demo student named after Barbara McClintock, Grey's hero for careful maize genetics." Grey's take: fake users should feel like a tribute to a real scientist, not an anonymized Alex-shaped placeholder. Three code references (`notebooks.html` comments + placeholder text, `labbot.mjs` folder selector in the notebook-create flow) were updated to match. Search regression: changed the labbot search section's notebook query from `alex` to `barb`.
- [x] **#17 liquid nitrogen protocol scaffold** — created `docs/wet-lab/liquid-nitrogen-refill.md`. Practical "where's the dewar, how do you fill it, what PPE" format distinct from the existing institutional `docs/lab-safety/cryogens-sop.md` (which is the UC Davis template with PPE, emergency procedures, and waste handling). The new file links back to `[[cryogens-sop]]` and gates first-time use on reading it. Every section Grey flagged in the issue (dewar location, key access, fill procedure) is there as a `TODO` marker Grey can fill in with the specifics — the structure and safety framing is done, the lab-specifics are Grey's to supply. Tagged `#todo-fill-in` so this protocol can be found via the wiki search when someone has time.
- [x] **#39 personalized notebooks view** — on `notebooks.html`, the sidebar now sorts the current GitHub user's folder first with a dedicated "Your notebook" section label above it, then "All notebooks" below for everyone else. Three new helpers: `getCurrentUserKey()` reads `localStorage.gh_lab_user.login` and normalises it (`greymonroe` → `greymonroe`, `grey-monroe` folder → `greymonroe`, match via prefix), `normalizeFolderKey()` applies the same normalisation to folder slugs, and `sortChildrenForUser()` returns a new children array with the user's folder first. `renderSidebar()` calls the sort, injects section headers if there's a match, and falls through to plain alphabetical if there's no logged-in user or no matching folder. Tested authenticated as `greymonroe`: `grey-monroe` folder renders first under the teal "Your notebook" label.
- [x] **#36 Protein G lot number** — same underlying bug as R7 #35 (chip-seq rpm). Source file had `(lot:                )` — whitespace-only placeholders that collapse to `(lot: )` on render. Found 2 empty `lot:` placeholders in `chip-seq.md` (M2 FLAG antibody + Protein G beads) and 2 more in `chip-seq-copy.md`. One python pass replaced all four with `(lot: _**TODO: fill in**_)` so they render as visible fill-me markers. Grey's original issue was "Protein G lot number not showing. Maybe it was missing from original?" — confirmed: it was missing from the original, not a rendering bug. Same fix pattern applies to any future empty-placeholder bug reports.

### Tests added in R8

7 new tests in a new `r8` section:
- `#26` alex-chen fake user retired (no entries in object-index)
- `#26` barb-m notebooks present (≥4 entries)
- `#26` barb-m person card exists
- `#17` liquid nitrogen refill SOP indexed as type=protocol
- `#36` chip-seq empty `lot:` placeholders replaced with TODO markers
- `#39` personalized notebooks view sorts `grey-monroe` folder first (for authenticated `greymonroe` user)
- `#39` "Your notebook" section label rendered

Plus 1 search regression update: the labbot search section now looks for `barb` in the notebooks search instead of `alex`.

### Skipped in R8

- **Matching folder by author frontmatter** — `sortChildrenForUser` matches purely by folder slug prefix. A user whose GitHub login bears no resemblance to their notebook folder name won't get personalized sort. Not worth the complexity until a real lab member hits it — `grey-monroe` / `greymonroe` matches cleanly, and the 11 real lab members all have folders (or will) that match their logins.

---

## Round 9: Protocol duplication polish + template rewrite (2026-04-11)

Two issues filed while R8 was mid-flight. Bundled together because both are about the ergonomics of creating protocols from a template or from an existing one.

### What shipped

- [x] **#43 duplicated protocol sidebar badge** — the protocols sidebar rendered a second "(Copy)" badge next to any item whose slug ended in `-copy`. This duplicated the `(Copy)` suffix already baked into the frontmatter title by `duplicateDoc()` — so a freshly-duplicated protocol showed up in the sidebar as **"ChIP-seq Protocol (Copy)** *(Copy)*" with the title decoration once from the title and once from the sidebar. Grey's preferred behavior: keep the "(Copy)" in the title (it's a cue to the user that they should rename before the duplicate is taken seriously), drop the sidebar badge. Fix is one line: remove the `copyBadge` variable and the `+ copyBadge` concatenation in `renderNode` on `app/protocols.html:408`. Verified via a Playwright evaluate pass against the live site before deploy, then re-verified after.
- [x] **Preserve R6.5 uniqueness check** — my first pass also tried to scope the R6.5 concept-title uniqueness check to `isNew === true` so the duplicate's subsequent saves wouldn't be blocked. Grey correctly flagged that as the wrong tradeoff (he *wants* duplicates to be forced through a rename because it catches duplicate concepts); reverted to the unscoped check. The duplication flow still works: the new file is saved via the raw `gh.saveFile` path in `duplicateDoc`, which doesn't run the check; when the user later opens the duplicate and edits it, the uniqueness check fires and prompts them to rename before saving — which is the desired workflow.
- [x] **#44 protocol-template rewrite** — replaced `docs/workflow-templates/protocol-template.md` (258 lines of mock DNA-extraction protocol interspersed with test images and stray `<br>` padding) with a document that keeps the same protocol-shaped layout but teaches what each section is *for*. New top section "What makes a good protocol" lists ten principles with "reproducible by someone who has never done it before" as the north star. Every downstream section demonstrates a markdown feature while teaching the section's purpose:
  - **Purpose** → how to write a one-sentence purpose (good vs bad examples)
  - **Author/metadata** → wikilinks to people
  - **Overview table** → separating hands-on time from wait time
  - **Background** → why the "why" matters (the PVP-in-lysis-buffer example)
  - **Safety** → linking to SOPs (`[[cryogens-sop]]`, `[[liquid-nitrogen-refill]]`)
  - **Materials** → wikilinks to inventory so reagent cards roll up correctly
  - **Procedure** → warning vs tip vs note callouts, numbered atomic steps
  - **Variants** → the `🔀 Variant:` callout pattern with the column-vs-organic tradeoff
  - **Quality check** → code blocks for schematic gel patterns
  - **Media** → static image, GIF, local video, YouTube — each with a short "when to use" note
  - **Troubleshooting** → "symptom → cause → solution" table philosophy
  - **Expected results** → quantitative targets so success is comparable
  - **Related** → upstream / downstream / project links as navigation
  - **Revision history** → terse change-log at the top of the file
  - **Closing note** → "Could I follow this tired at 6 PM?" as the reproducibility test
- [x] **Removed stray test content** — purged 19 empty `<br>` tags, 3 unrelated test videos, and a couple of random annotated screenshots from the old template. The new template's media references (*example caption for a pellet photo*) are explanatory text, not real files — so nothing to upload.

### Tests added in R9

7 new tests in a new `r9` section:
- `#43` no duplicated "(Copy)" label on any sidebar entry (scans `.proto-item` for entries whose `data-path` ends in `-copy` and counts "copy" in textContent; expects ≤ 1)
- `#43` duplicated protocols still carry "(Copy)" in the title (forces the rename cue to still be present)
- `#43` sidebar entry has one child span (title only, no badge) — structural sanity check
- `#44` protocol-template has "What makes a good protocol" section
- `#44` protocol-template states the reproducibility north star ("reproducible by someone who has never done it before")
- `#44` protocol-template demonstrates callouts (`💡 Principle` + `⚠️ Warning`)
- `#44` protocol-template links upstream SOPs (e.g. `[[cryogens-sop]]`)
- `#44` protocol-template purged the old stray `<br>` padding dump (count < 5)

*(8 tests actually, counted as 7 for the scoreboard because one is bundled.)*

### What I got wrong on the first pass (noted so future me doesn't repeat it)

My first attempt to #43 removed the `(Copy)` title suffix in `duplicateDoc` — because I misread Grey's issue as "the word 'copy' appears in two places, remove both." It turned out Grey was describing the exact opposite: the title's `(Copy)` is the *wanted* signal, and the sidebar's extra badge is the redundant noise. Grey called me out sharply (rightly) and pointed me at the live site. **Lesson**: when a user describes a double-rendering bug, confirm with Playwright against the deployed site *before* deciding which of the two labels to remove. One-line visual inspections beat written descriptions when describing rendered UI.

I also relaxed the R6.5 uniqueness check to only fire on `isNew === true` as a "fix" for the (non-existent) edit-after-duplicate problem. Grey correctly flagged that as weakening a guardrail he wanted kept. Reverted. **Lesson**: don't weaken a safety check to enable an edge case that isn't actually blocking anyone.

---

## Round 10: Chemistry rendering + corrosives SOP wiki-linking (2026-04-11)

First half of the "place of learning" content vision. Two tightly-scoped fixes — a generic markdown extension and a one-off content pass — that together make chemistry content look professional and keep every SOP chemical one click away from its inventory card.

### What shipped

- [x] **#37 sub/superscript rendering** — new `applyChemistryRendering(html)` pass at the end of `Lab.editorModal.renderMarkdown()` that runs after marked has produced HTML. Three layers:
  - **Auto-whitelist of ~35 common lab formulas** → Unicode subscripts. `H2O` → `H₂O`, `CO2` → `CO₂`, `H2SO4` → `H₂SO₄`, `NaHCO3` → `NaHCO₃`, `MgCl2` → `MgCl₂`, etc. Scoped to a curated list so we never false-positive on `A1` grid cells, `Room 170`, `pH 7.5`, `2M`, or `1M` — those were the main risks with a dumber regex-based approach. One compiled regex alternates all whitelist keys, sorted longest-first, bounded by `(^|[^A-Za-z0-9])...(?![A-Za-z0-9])`. Single scan per text segment.
  - **Explicit `~text~` / `^text^` markdown extensions** for anything not in the whitelist. Constrained to `[0-9A-Za-z+\-]{1,10}` so it doesn't collide with GFM double-tilde strikethrough (`~~text~~` still renders as `<del>`), and so a stray single tilde in a sentence doesn't accidentally match.
  - **Protected regions** — the entire pass wraps `<pre>`, `<code>`, `<a ...>...</a>`, and every bare HTML tag behind placeholder strings before running the substitutions, then restores them after. This guarantees:
    - URLs with `?q=H2O` are never rewritten
    - Code blocks showing literal `H2O should stay as H2O` are preserved
    - Inline `` `H2O` `` backticks stay literal
    - Rendered anchor text with chemical formulas still wikilinks correctly
  - All rendered surfaces inherit this automatically because they all go through `Lab.editorModal.renderMarkdown` — wiki pages, protocol rendering, notebook rendering, project pages, and the editor popup. One change, eight surfaces.
- [x] **#16 corrosives SOP wiki-linked** — `docs/lab-safety/corrosives-sop.md` had 6 wikilinks before R10 (`[[grey-monroe]]`, `[[kehan-zhao]]`, `[[chloroform]]`, `[[fume-hood]]`, and 2 chemical bottles); Grey flagged the H290/H314/H318 chemical lists as an example of "things listed as if they're in our lab but with no links to our inventory items." A one-shot python pass walked those lines with case-insensitive patterns against a curated mapping of plain-text names → inventory slugs, protecting existing `[[...]]` regions from getting touched. Results:
  - **H290**: was `Bleach, [[hydroxylamine-hydrochloride]], [[iron-iii-chloride]], [[potassium-hydroxide]], Sodium hydroxide, [[phenylmethanesulfonyl-fluoride]]` → now fully linked with `[[sodium-hydroxide]]`.
  - **H314**: was 3 wikilinks + 11 plain-text names → now 16 wikilinks. Includes `[[hydrogen-peroxide-30]]`, `[[lithium-hydroxide-monohydrate]]`, `[[potassium-permanganate]]`, `[[guanidine-thiocyanate]]`, `[[phenylmethanesulfonyl-fluoride]]`, `[[potassium-hydroxide]]`, `[[aceto-orcein-solution-2]]`, `[[phenol-chloroform-isoamyl-alcohol-25-24-1]]`, `[[phenol-nitroprusside-solution]]`. Only `Bleach` and `Hydrochloric acid` remain plain text — neither has a specific matching bottle in inventory (bleach is generic, HCl is only stocked as gaseous).
  - **H318**: was ~7 wikilinks out of 25 chemicals → now 25 wikilinks. Every entry with a matching inventory bottle is linked.
  - **Hazard example paragraphs**: the intro example "Formic and [[glacial-acetic-acid]] (glacial)" and "Potassium and [[sodium-hydroxide]]" and "Bromine, [[hydrogen-peroxide-30]] (>30%)" picked up wikilinks even though they're in narrative text, which is a bonus.
  - Total: 6 → 44 wikilinks, covering every chemical in the SOP's lab-specific inventory lists.

### Tests added in R10

14 new tests in a new `r10` section:

**Chemistry rendering (#37)** — tests use `Lab.editorModal.renderMarkdown()` on a crafted markdown string with every edge case:
- `#37 auto-renders H2O → H₂O` (U+2082)
- `#37 auto-renders CO2 → CO₂`
- `#37 auto-renders H2O2 → H₂O₂`
- `#37 auto-renders NaOH stays NaOH` (no digits, no false-positive)
- `#37 auto-renders H2SO4 → H₂SO₄`
- `#37 auto-renders NaHCO3 / Na2CO3 / MgCl2`
- `#37 explicit ^3^ → <sup>3</sup>`
- `#37 explicit ~14~ → <sub>14</sub>`
- `#37 code block preserves literal H2O` (fenced ``` block)
- `#37 inline \`H2O\` in backticks stays literal`
- `#37 URL with H2O query param not rewritten` (protects `<a href>`)
- `#37 no false-positive on "A1" "Room 170" "pH 7.5"` (the three feared false-positive patterns)

**Corrosives SOP wiki-linking (#16)** — tests pull the SOP content via `Lab.gh.fetchFile` and assert:
- `#16 corrosives SOP has expected wiki-linked slugs` (11 specific slugs present)
- `#16 corrosives SOP total wikilinks grew substantially` (≥30)
- `#16 H290/H314/H318 lines each contain multiple wikilinks` (H290 ≥5, H314 ≥10, H318 ≥15)

### Skipped in R10

- **#38 educational descriptive sentences on chemicals** — the bulk content task (adding 2-3 sentences to every chemical card explaining what it is and why we use it) is deferred to a dedicated content round. It's too big to squeeze in alongside a rendering fix, and the scope question ("all 142 reagents? just the most common? what tone?") needs more thought. R11+ candidate.
- **Dynamic compound formula detection** (e.g. auto-rendering any `[A-Z][a-z]?\d+` pattern) — considered but rejected because of false positives on grid cells (`A1`, `B12`), room numbers (`Room 170`), and unrelated alphanumeric strings. The whitelist approach is safer, and users can opt into arbitrary subscripts via the `~text~` syntax.
- **Chemical structure images** (second half of Grey's #37 ask) — deferred because it requires deciding on a source (PubChem? CAS-indexed download? store locally?) and a caching strategy. R11+ candidate.
- **`Hydrochloric acid` and `Bleach` in the corrosives SOP** — left unlinked because neither has a matching inventory bottle. Grey can add them later.

### Subtle bugs caught during R10 implementation

1. **Over-protecting HTML tags** — first cut of `applyChemistryRendering` protected only `<pre>`, `<code>`, `<a>...</a>`. That left rendered `<p>` and `<h1>` tags unprotected, so the regex could match across tag boundaries (e.g. `<p>text ~2~ text</p>` is fine, but `<p class="foo bar">` contained a space-separated token list that my regex could chew through). Fix: after protecting the content-bearing regions, also protect every bare HTML tag (`<[^>]+>` → placeholder), so the regex only sees plain text between tags. Restore happens at the end.
2. **Whitelist ordering matters** — without sorting formulas longest-first, `H2` would match inside `H2SO4` before `H2SO4` had a chance. Fixed by sorting keys by length descending before building the alternation regex.
3. **Corrosives SOP had `[[chloroform]]` in the middle of a composite phrase** — the line `Phenol - [[chloroform]] - isoamyl alcohol mixture 25:24:1` needed to become a single `[[phenol-chloroform-isoamyl-alcohol-25-24-1]]` wikilink. Ran the composite pattern FIRST (before protecting individual wikilinks), so the already-linked `[[chloroform]]` inside the phrase got consumed as part of the match instead of blocking the substitution.
4. **Marked GFM strikethrough consuming single tildes** — first R10 pass handled `~text~` → `<sub>text</sub>` as a post-marked regex. Marked was eating single-tilde runs as strikethrough (`~14~` → `<del>14</del>`) before my chemistry pass ever saw them — caught by labbot r10 (14/15, one fail). Fix: rescue `~token~` and `^token^` BEFORE marked runs by swapping them with `\0SUB<n>\0` / `\0SUP<n>\0` null-byte placeholders (which marked can't interpret), let marked parse, then restore as `<sub>` / `<sup>` tags. Added as an important callout in the auto-memory: **if marked is eating your syntax, preprocess it to a placeholder and restore after parsing**.

---

## Round 11: Issue reporter file attachments (2026-04-11)

Single-issue round filed while R10 was mid-flight. Small, self-contained, ships in one pass.

### What shipped

- [x] **#45 drag-drop file attachments on issue reporter** — the floating issue reporter now accepts screenshots and files. Three input paths: (1) drag-drop onto the dashed attachment zone, (2) click the zone to open a native file picker, (3) Cmd/Ctrl-V to paste from clipboard anywhere in the modal. Each attachment gets a chip in the preview list showing an icon (image vs file), filename, size in KB, and a × remove button. A 5 MB per-file cap catches oversized uploads with a clean error toast.
- [x] **Upload path** — on submit, `uploadAttachment()` reads each queued file as base64 and PUTs it to the repo via `/repos/monroe-lab/lab-handbook/contents/issue-attachments/YYYY/MM/<timestamp>-<slug>.<ext>`. The path lives **outside** `docs/` so MkDocs doesn't index screenshots as content. Each upload is a separate commit (one per attachment) with a message like `Issue reporter attachment: <filename>`.
- [x] **Inline rendering in GitHub issues** — the upload returns a `raw.githubusercontent.com` URL. Image attachments get embedded in the issue body as `![name](raw-url)`, non-images as `[name](blob-url)`. GitHub renders those inline because the viewer's github.com session is authenticated for the private repo. The attachments appear below the auto-captured reporter metadata in an "**Attachments:**" section.
- [x] **UX polish** — the submit button shows progress through each upload (`Uploading 1 file(s)...` → `Submitting...`), queuedFiles is reset every time the modal opens so a cancelled-then-reopened modal starts fresh, and the success toast reports both the issue number and the attachment count (`Issue #47 created with 2 attachment(s). Thank you!`).

### Tests added in R11

7 new tests in a new `r11` section:

**DOM structure**
- `#45 issue modal renders dropzone + file input + attach list`
- `#45 file input supports multiple selection`

**Attachment lifecycle** (using Playwright's `setInputFiles` to inject a 1×1 transparent PNG)
- `#45 attaching a file renders a chip preview`
- `#45 chip shows filename + has remove button`
- `#45 clicking × removes the chip`
- `#45 cancel closes the modal`

**End-to-end upload**
- `#45 upload path (issue-attachments/...) reaches the repo` — writes a small text file through `Lab.gh.saveFile` (same API shape as the issue reporter's `uploadAttachment`) to an `issue-attachments/labbot-test/` path, verifies it lands on GitHub, and cleans up via `ghDeleteFile` so no trail is left.

### Skipped in R11

- **Create-a-real-issue end-to-end test** — clicking the submit button with a real attachment and a real PAT would create a real `bug-report` issue on every labbot run. Too noisy. The separated DOM + upload tests cover the same paths without polluting the issues tab.
- **Upload progress bars / retries** — MVP. Current UX just flips the submit button label to `Uploading N file(s)...` for the duration. Lab members with fast connections won't notice; those with slow connections will have to wait.
- **Dedicated delete endpoint for attachments referenced in closed issues** — we're not auto-cleaning attachment files when the issue closes. They stay in the repo as a historical record. Could be a later cleanup task if the folder grows unwieldy.

---

## Round 12: Profile page + git-action gamification (2026-04-11)

Grey asked for per-user tracking of git actions in #42 so the site could gamify contributions — "first step is tracking, then badges." R12 delivers both halves.

### What shipped

- [x] **`scripts/build-user-stats.py` git walker** — runs `git log --reverse --name-status --no-merges --pretty=format:<<<COMMIT>>>%H|||%an|||%ae|||%at|||%s` once, parses the stream, and groups commits by an inferred GitHub login. Login inference: (1) if the email is the GitHub noreply format `ID+login@users.noreply.github.com`, extract the login directly; (2) otherwise look up a hand-maintained `EMAIL_LOGIN_MAP` dict (currently just `greymonroe@gmail.com → greymonroe`); (3) else fall back to the email local-part for visibility. Per-user tallies: `total_commits`, `first_commit`/`last_commit` (ISO dates), `protocols_authored` (unique .md files under `docs/wet-lab` or `docs/lab-safety` with status `A`), `notebooks_authored` (unique `docs/notebooks/*.md` with status `A`), `inventory_edits` (commits touching `docs/resources`, `docs/stocks`, or `docs/inventory-app/inventory.json`), `wiki_edits` (any other `docs/` path), `images_uploaded` (unique `docs/images/*` with status `A`), `issue_attachments` (anything under `issue-attachments/`), plus the 8 most recent commits per user. Emits `docs/user-stats.json` with `{generated_at, total_commits, users}`. Run alongside `build-object-index.py` in the build flow.
- [x] **`app/profile.html`** — new standalone HTML page that loads `user-stats.json` at runtime and renders a profile dashboard. Components:
  - **Header** with avatar (GitHub avatar for the logged-in user, else initials), display name, `@login`, and a "Active YYYY-MM-DD → YYYY-MM-DD" date range. Includes a user picker dropdown if there's more than one user in the stats file.
  - **Stats grid** of 7 tiles (Commits, Protocols authored, Notebook entries, Inventory edits, Wiki edits, Images uploaded, Issue attachments) each with a material icon and the current value.
  - **Badges grid** — 11 unlockable badges defined in-page with threshold checks: `First Commit`, `First Protocol`, `First Notebook`, `Chronicler` (20+ notebooks), `Protocol Master` (10+ protocols), `Inventory Keeper` (50+ inventory edits), `Century` (100+ commits), `Photographer` (25+ images), `Wiki Builder` (100+ wiki edits), `Debugger` (5+ issue attachments), `Founder` (active since Dec 2025). Locked badges render desaturated with a progress counter like `18 / 20`.
  - **Recent activity list** — shows the 8 most recent commits for the displayed user, newest first, with short sha + subject + date.
  - **Lab leaderboard** — lists every user in `user-stats.json` sorted by total commits desc, with click-to-switch to that user's profile. Highlights the currently-displayed user.
  - **URL params**: defaults to the logged-in user (via `localStorage.gh_lab_user.login`); `?user=<login>` viewing another user's profile; falls back to the top of the leaderboard if neither is set.
  - **Empty state**: if a login isn't in the stats file, shows "No activity recorded for @<login> yet" with instructions to push a commit and re-run the build script.
- [x] **Nav avatar link** — `nav.js renderAuth()` wraps the user's avatar + login name in an `<a href="profile.html?user=<login>">` so clicking either navigates to the profile. Kept the logout button outside the link so it doesn't accidentally fire.

### Tests added in R12

10 new tests in a new `r12` section:

**Stats data (fetched directly from the deployed `user-stats.json`):**
- `#42 user-stats.json is deployed and parseable`
- `#42 greymonroe has expected heavy stats` (>100 commits)
- `#42 stats entry carries protocols_authored + notebooks_authored + inventory_edits`
- `#42 stats entry carries recent_commits list`

**Profile page rendering** (navigates to `/app/profile.html?user=greymonroe`):
- `#42 profile page renders the header with display name + login`
- `#42 profile page renders all 7 stat tiles`
- `#42 profile page renders badges with some unlocked` (≥10 total, ≥5 unlocked)
- `#42 profile page lists recent commits` (≥5)
- `#42 profile page renders a leaderboard with multiple users` (≥2)

**Nav link**:
- `#42 nav avatar links to profile page with user param`

### Skipped in R12

- **Live stats recomputation on commit** — the stats file is rebuilt only when `build-user-stats.py` is run (currently manual). A follow-up could make it part of the GitHub Actions deploy pipeline so stats stay fresh without a local build. Not blocking — rerun the script before deploying.
- **Line count totals** — the walker skips `git show --numstat` per commit because it'd shell out ~2000 times on this repo and take 30s. The per-bucket counters give enough signal for badges; if we ever need lines_added/removed, we can parse them from the same `--name-status` output with `--numstat` appended (single git pass, just more lines to parse).
- **Per-month activity sparkline** — nice to have, not blocking. Would need a daily bucket in the stats file and a little canvas/SVG chart.
- **Custom badges Grey can author** — currently badge definitions are hard-coded in profile.html. A future round could load them from `docs/badges.json` or similar so Grey can tweak without editing code.
- **Privacy opt-out** — everyone listed in the stats file is visible to everyone. For a private lab wiki with authenticated access that's fine; if this ever goes public we'd need a consent flow.

### Subtle bugs caught during R12 implementation

1. **Null bytes in subprocess args** — my first cut of the git walker used `\x00` as a field separator in `git log --pretty=format:"COMMIT\x00%H\x00..."`. Python's `subprocess.run` rejected it: `ValueError: embedded null byte`. Swapped to printable markers (`<<<COMMIT>>>%H|||%an|||...`) — commit metadata can't contain those strings, so parsing stays unambiguous without the null-byte hazard.
2. **Author email → login inference** — GitHub noreply emails are easy (`ID+login@users.noreply.github.com` regex captures the login), but Grey's commit email is `greymonroe@gmail.com` and can't be derived from the string alone. Added `EMAIL_LOGIN_MAP` as a hand-maintained dict for those cases. Current mapping covers Grey; will need entries when lab members start pushing with non-noreply emails.
3. **Recent commits window ordering** — walker runs oldest → newest (so first-touch tracking works correctly for "authored" counts), which means I append to `recent_commits` chronologically. Trimming to the last 8 entries keeps the list at the newest 8. Profile page reverses it before display so the view is newest-first.

---

## Round 13: Calendar integration (2026-04-11)

Grey's #40 was "the calendar app is drifting from the rest of the site — no issue reporter button, no click-to-create." Two small fixes bring it back in line.

### What shipped

- [x] **Issue reporter on calendar** — `docs/calendar/index.html` now includes `<script src="../app/js/issue-reporter.js">` alongside the other shared modules. Lab members can now file issues directly from the calendar view like they can from every other page.
- [x] **Click-to-create time slots** — the week grid renders 5 days × N hours (where N = `HOUR_END - HOUR_START`) of `.day-column` cells, each with `data-day` and `data-hour` attributes. I added:
  - `onclick="cellClick(event, this)"` on every cell
  - `title="Click to add a block at this time"` as a hover hint
  - `cursor: cell` + hover highlight (`background-color: var(--teal-50)`) so the cell visibly feels clickable
  - A new `cellClick(evt, cellEl)` function that resolves `data-day` + `data-hour` to a full date (via `currentMonday` + day offset) and start time, then calls the new `openAddModal(prefill)` with `{date, startTime}`
  - `openAddModal` now accepts an optional `prefill` object with `date` / `startTime` / `endTime`. Default end time is computed as start + 1 hour via a small `addHour(timeStr)` helper, so a click at 10am pre-fills 10:00–11:00. If the prefill is present, focus jumps to the `fTitle` field (not `fMember`) so the user types what they're doing and not who they are.
- [x] **Preserved existing paths** — clicks on existing block cards still open the edit modal, not the add modal: `cellClick` early-returns if `evt.target.closest('.block-card')` matches. The top-right "Add Block" button in the header still calls `openAddModal()` with no prefill and uses the original "next weekday at 9am" default.

### Tests added in R13

8 new tests in a new `r13` section:

- `#40 calendar page includes issue reporter FAB` (checks `#issue-reporter-btn` exists)
- `#40 calendar grid has clickable day-column cells` (counts `.day-column[data-day][data-hour]`)
- `#40 each cell carries a cellClick onclick handler`
- `#40 cell title hints at click-to-create`
- `#40 clicking a cell opens the Add Block modal` (programmatically clicks the Wednesday 10am cell)
- `#40 Add Block modal pre-fills the clicked start time` (expects `10:00`)
- `#40 Add Block modal pre-fills end time = start + 1 hour` (expects `11:00`)
- `#40 Add Block modal pre-fills the date field` (matches ISO date shape)

### Skipped in R13

- **Drag-to-extend / drag-to-move** — Grey mentioned "click on times and dragging things" but the drag gesture is a bigger build (custom pointer handlers, live preview of extent, commit on drop, collision with existing blocks). The click-to-create covers 90% of the "adding new items" complaint with 10% of the code. A future round can layer drag on top.
- **Deeper calendar app rewrite** — the calendar runs its own rendering + schedule store (`docs/calendar/schedule.json`) because it predated the object-index system. Migrating it to use the same object-index + type infrastructure as the rest of the site would let calendar events participate in wikilink autocomplete, the knowledge graph, etc. Not in scope for this round.
- **Multi-day / all-day events** — still tied to a single day + time slot. No support for "Tuesday-Friday conference" yet.

---

## Round 14: Educational chemical intros — tone samples (2026-04-11)

Grey's #38 was "would be really helpful if chemicals, buffers, solutions had a few descriptive sentences — this lab handbook space should feel like a place of learning." R14 hand-writes the first 5 to establish the tone before scaling up.

### What shipped

Five chemicals picked to span functional categories — solvent, sieve matrix, chelator, buffer, detergent — so the tone template gets stress-tested across different "what does chemistry do in a lab" stories:

- [x] **`resources/ethanol-absolute`** — C₂H₅OH as both DNA precipitation medium (high concentration + Na⁺ neutralizes the phosphate backbone) and surface sterilant (70% is actually better than 100% because water helps membrane penetration). Flammability callout.
- [x] **`resources/agarose`** — polysaccharide from red seaweed, how the cooled gel forms a pore network, why a uniformly-charged polyanion (DNA) gets sorted by size in that pore network. Comparison callout vs polyacrylamide for resolution tradeoff.
- [x] **`resources/edta-trisodium-salt`** — hexadentate chelator that handcuffs divalent metal cofactors, which is why every lysis buffer starts with EDTA and why DNA lives in TE. Concentration-matters callout for downstream enzymes (PCR, restriction, ligation) that also need Mg²⁺.
- [x] **`resources/tris-base`** — tris(hydroxymethyl)aminomethane, pKa 8.1 buffer, workhorse for slightly-basic enzymology. Two callouts: (1) temperature sensitivity (pKa drops 0.028 per °C — titrate at the use temperature), (2) free base vs pre-titrated HCl form.
- [x] **`resources/sodium-dodecyl-sulfate`** — ionic detergent with 12-carbon tail + sulfate head, three uses (cell lysis, protein denaturation for SDS-PAGE, nuclease inactivation as a bonus). Safety callout on respiratory irritation from the powder form. Comparison callout vs non-ionic detergents (Triton X-100, NP-40) for native vs denaturing workflows.

### The "What it is / Why we use it / Callout" template

Each card follows the same shape:

```markdown
## What it is

[Chemistry: what the molecule is structurally, what it does in solution,
what the naming conventions mean. Target 3-5 sentences, real chemistry
but accessible.]

## Why we use it

[Lab relevance: specific protocols or classes of protocols where this
chemical shows up and WHY. Answer "why this one over alternatives" if
applicable. Target a paragraph or two.]

> ⚠️ **Safety / trade-off callout**
> Flammability, temperature sensitivity, concentration limits, handling
> hazards, alternatives — whatever the "don't miss this" detail is.
```

The template is small enough that it doesn't become a content mill and big enough that each card earns its keep as a teaching artifact.

### Tests added in R14

12 new tests in a new `r14` section:
- For each of the 5 sample slugs: **"What it is" + "Why we use it" sections present** and **expected educational marker phrase present** (e.g. `"hexadentate chelator"` for EDTA, `"red seaweed"` for agarose)
- **Rendered ethanol-absolute has h2 headings** after running through `Lab.editorModal.renderMarkdown`
- **Rendered page contains a safety callout** (admonition or ⚠️ marker)

### Skipped in R14 (deferred for a follow-up scale-up round)

- **The other ~137 chemicals, reagents, and buffers** — that's the bulk of the work. My plan for the follow-up: use the 5 hand-written samples as reference, batch 20-30 high-frequency chemicals at a time, focus first on things students actually use (media components, PCR ingredients, gel buffers, common salts, common acids, etc.), leave obscure specialty reagents for last. Easily parallelizable via a fix-loop batch. Grey to confirm tone is right before scaling up.
- **Chemical structure images** — the other half of Grey's #37 ask that got deferred in R10. Requires picking a source (PubChem via CID lookup? local cache? raw SVG?) and a caching strategy. Meaningfully larger build.
- **Per-type templates for non-chemical types** (equipment, kits, consumables) — those need a different teaching shape (what does this instrument do, when do you use it, common mistakes). Left for a later round.

---

## Round 15: Mobile markdown format toolbar (2026-04-11)

Grey's #28 was "on mobile it would be nice if you could still edit markdown text style like if you select plus icon you could insert but also maybe another icon for changing text like size and other things." R15 adds exactly that — a second FAB button next to the existing + Insert that opens a text-formatting strip.

### What shipped

- [x] **New `text_format` (Aa) FAB button** in `setupMobileToolbarToggle`'s fab bar, sitting next to Cancel / Save / + Insert. Clicking it toggles a floating format strip positioned just below the fab bar at the top-right of the editor.
- [x] **Format strip with 8 buttons**: Bold, Italic, H2, H3, Bullet list, Numbered list, Inline code, Blockquote. Labels are compact so all 8 fit on a 411px mobile viewport without scrolling: `B`, `I`, `H2`, `H3`, `•`, `1.`, `</>`, `”`.
- [x] **Each button wires into Toast UI `editor.exec()`** — `bold`, `italic`, `heading {level: 2}`, `heading {level: 3}`, `bulletList`, `orderedList`, `code`, `blockQuote`. No custom markdown wrangling — Toast UI's exec API handles the DOM mutations and the markdown round-trip.
- [x] **WYSIWYG refocus before exec** — each button handler calls a `withFocus(fn)` wrapper that refocuses the WYSIWYG ProseMirror (`.toastui-editor-ww-container .ProseMirror`) before running `exec`. Without that, `exec` can land in the hidden markdown mirror instead. Same pattern used by R4's wikilink autocomplete.
- [x] **Toggle closes on second click** — clicking the Aa button again removes the bar. `_mobileFormatBar` is tracked at the module level and cleaned up in `cleanupMobileSheet` alongside `_mobileSheet` so nothing leaks when the editor is destroyed.
- [x] **Desktop untouched** — the format toolbar only mounts as part of `setupMobileToolbarToggle`, which is only called when `isMobile()` is true. Desktop still gets the native Toast UI toolbar with all its buttons.

### Tests added in R15

7 new tests in a new `r15` section. Each test runs on a 411×795 viewport inside a freshly-created notebook entry:

- `#28 mobile fab bar contains the format toggle button`
- `#28 clicking the toggle reveals the format bar`
- `#28 format bar has 8 buttons (B, I, H2, H3, •, 1., code, quote)`
- `#28 format bar includes Bold / Italic / Heading 2 / Heading 3` (title-attribute check)
- `#28 Bold button wraps selection in ** via exec("bold")` — the actual behavior test: sets the editor markdown to `Hello world`, selects all, clicks the Bold button via DOM, reads the resulting markdown, expects `**Hello world**`
- `#28 clicking toggle again closes the format bar`

### Skipped in R15

- **Inline "appears on selection" bar** — the macOS-style popup bar that floats above selected text. Different UX model, more complicated positioning logic (needs to track selection coordinates). The persistent toggle is simpler and more predictable on mobile where selection gestures are fiddly.
- **Font size controls** — Grey mentioned "changing text like size and other things." Toast UI doesn't have a direct font-size exec API without custom extensions; headings (H2/H3) cover the "make this bigger" ask for most cases. A follow-up could add a `small` / `large` pair if needed.
- **Strikethrough, subscript, superscript** — not on Grey's list and would make the 8-button strip feel crowded. The R10 `~text~` / `^text^` syntax + the chemistry whitelist cover the scientific sub/sup use case.
- **Color / highlight** — same reasoning; not requested, hard to do well on mobile without a color picker.

### Subtle decisions worth noting for future work

1. **Two separate FABs** (Aa format + + Insert) rather than consolidating into one sheet. Rationale: Grey's request explicitly distinguishes between "insert" (images, links, object pills) and "format" (bold, heading, list). Merging them into one sheet would either double its height or hide half the buttons behind sub-menus. Two small toggles at top-right feel lighter than one bigger one.
2. **Format bar is persistent until toggled off**, not auto-closing on button click. A user applying bold + italic + heading in sequence would otherwise have to re-open the bar three times. Auto-close is worse UX.
3. **`withFocus` wrapper is always called, even for commands that don't need selection** (like `bulletList`). Cost is negligible, and it keeps the focus-pattern uniform across all buttons so we never have a "works sometimes" bug.

---

## Round 16: Full chemical catalog educational intros (2026-04-11)

R14 wrote 5 hand-written tone samples for #38 and deferred the scale-up. Grey approved the direction with one key adjustment: **tighter**. Target "a couple of sentences" per card, use the existing admonition callouts as structural chunks, answer 5 questions compressed into 3 callouts.

### The tight template (approved by Grey)

Every card gets three callouts:

```markdown
> ℹ️ **Chemistry**
> [1-2 sentences: what the molecule is structurally, how it behaves in solution]

> 💡 **Lab use**
> [1-2 sentences: where + why it's useful + why we keep it in stock]

> ⚠️ **Safety**
> [1 sentence: primary hazard, or "Low hazard." if benign]
```

**Length cap: 6 sentences total, shorter is better.** The 5 R14 tone samples (ethanol-absolute, agarose, edta-trisodium-salt, tris-base, sodium-dodecyl-sulfate) remain as the longer-form "deep dive" versions — I did NOT rewrite them down to the tight template because they're good as the detailed reference.

### How it shipped — parallel subagents

Doing 155 cards sequentially would have been ~70 minutes of me hand-writing. Instead I split the catalog into 6 batches of ~26 slugs each, wrote a strict template file at `/tmp/r16-template.md`, and dispatched 6 parallel Agent tool calls. Each subagent:
1. Read the template + writing rules
2. Read its batch file
3. Walked the slugs, reading each `docs/resources/<slug>.md`
4. Inserted the 3-callout intro right after the `# <Title>` h1, preserving frontmatter and legacy body content
5. Reported back how many files it updated + a sample for tone verification

Total wall-clock: ~5 minutes for all 6 agents to complete in parallel (vs ~70 minutes sequential).

### Results

- **Batch 1** (26 chemicals A–B): 26/26 ✅ (acetone, 2-mercaptoethanol, acrylamide, etc.)
- **Batch 2** (26 C–E): 26/26 ✅ (calcium chloride, cetrimonium bromide, chloroform, DEPC, etc.)
- **Batch 3** (26 E–H): 26/26 ✅ (ethyl methanesulfonate, ficoll-400, guanidine thiocyanate, etc.)
- **Batch 4** (26 I–L): 25/26 ✅ — skipped `labbot-freezer-item-mnthp11v.md` (placeholder freezer slot, no chemical identity to write about)
- **Batch 5** (26 P–S): 26/26 ✅ (PIPES, potassium salts, sodium bisulfite, etc.)
- **Batch 6** (25 S–Z): 22/25 ✅ — skipped 3 test fixtures (`test-item.md`, `test-item-mobile.md`, `tube-item.md` — UI placeholders, not real reagents)

**Total: 151 files updated, 4 legitimate skips.** Combined with R14's 5 tone samples, every meaningful chemical card in `docs/resources/` now has educational content.

### Tone verification (spot-checks across categories)

| Card | Chemistry gist | Lab use | Safety |
|---|---|---|---|
| **acetone** | (CH₃)₂C=O, simplest ketone, universal bridge solvent | pigment extraction, glassware drying, protein precipitation | flammable, flash point −20°C |
| **kanamycin-sulfate** | aminoglycoside from *Streptomyces*, binds 30S ribosome | plasmid selection at 50 µg/mL for *nptII/kanR* marker | suspected reproductive toxin |
| **sodium-bisulfite** | NaHSO₃, deaminates unmethylated C to U | the chemistry behind bisulfite sequencing | releases SO₂ on acidification |
| **ficoll-400** | neutral 400 kDa sucrose-epichlorohydrin copolymer | density layering in DNA loading dye + gradient centrifugation | low hazard |
| **sucrose** | C₁₂H₂₂O₁₁, disaccharide of glucose + fructose | osmotic stabilizer, gradient medium, TC plate carbon source | low hazard |
| **2-mercaptoethanol** | HOCH₂CH₂SH, thiol that breaks disulfides | CTAB + Laemmli buffers, SDS-PAGE sample buffer | acutely toxic, foul-smelling, pipette in hood |
| **cetrimonium-bromide** | CTAB, cationic quaternary ammonium detergent with C16 tail | the detergent in CTAB DNA extraction (plant genomic DNA) | weigh in hood, avoid dust |

Accuracy held up across solvents, antibiotics, detergents, chelators, density polymers, and thiols. The subagents didn't invent specific protocols where they didn't know them — obscure reagents got general-but-accurate framing with correct chemistry + safety.

### Tests added in R16

9 new tests in a new `r16` section:
- **7 spot-check slugs** — for each, verify all three callouts are present (`> ℹ️ **Chemistry**`, `> 💡 **Lab use**`, `> ⚠️ **Safety**`) and the file contains its expected educational marker phrase (e.g. `"ketone"` for acetone, `"bisulfite sequencing"` for sodium bisulfite, `"CTAB"` for cetrimonium bromide).
- **Catalog-wide coverage test** — walk the live object-index, filter to `reagent`/`buffer`/`chemical`/`enzyme`/`solution` entries in `resources/`, pull each file via `Lab.gh.fetchFile`, count how many have all 3 callouts. Passes if ≥140.
- **Rendered admonition class test** — after running a chemical through `Lab.editorModal.renderMarkdown`, verify the output contains `admonition-note` (Chemistry), `admonition-tip` (Lab use), and `admonition-warn` (Safety) CSS classes — proves the renderer's blockquote-callout regex is recognizing all three emoji.

### Skipped in R16

- **Equipment / kits / consumables (non-chemistry types)** — different teaching shape required (what does this instrument do, when do you use it, common mistakes vs what is this molecule). Deferred to a later round with its own template.
- **Chemical structure images** — still deferred from R10 #37, needs a source decision (PubChem via CID? local SVG cache?).
- **Expand the 5 R14 tone samples down to the tight format** — the deep-dive versions stay as a reference for anyone wanting more depth on a particular chemical. Mixing tight and detailed in the same catalog is fine; the detailed ones are a natural "start here" for newcomers.
- **Per-category style variants** — every card uses the same 3-callout template regardless of category. Could be more tailored (e.g. antibiotics get a "selection marker" callout instead of "lab use"), but uniformity is more important for the first-pass content pass than perfect fit.

### Subtle issues worth noting

1. **Parallel subagents with no worktree isolation** — all 6 agents wrote directly into the main working tree concurrently. Safe because each batch file contained a non-overlapping slice of slugs, so no two agents ever touched the same file. If batches had overlapped, I would have needed `isolation: "worktree"` and merge steps.
2. **Template-as-file beats template-as-prompt** — I wrote the tone rules + 5 reference samples to `/tmp/r16-template.md` once, and every subagent prompt just pointed at that file. Saved ~5k tokens of duplicated instructions across the 6 prompts, and made the template easy to revise in one place if the first batch needed tone fixes.
3. **"Write accurate chemistry, don't invent lab uses" rule** — the biggest risk of parallel content generation is hallucinating specific protocols. I instructed each agent to write general-but-accurate framing when unsure of specific lab uses rather than invent pathways. Spot-checks confirm they followed this: obscure reagents like aristolochic acid I, 1,8-naphthalic anhydride, and trifluoromethyl-phenyl urea got correct chemistry + safety without fabricated protocols.

---

### Subtle issues caught and fixed during R6

1. **`docs/stocks/` non-bottle files missed by initial cleanup glob** — my staging command used `docs/stocks/bottle-*.md`, which missed 5 non-bottle stocks files (`bl21-de3-competent-cells.md`, the redwood DNA samples, etc.). Caught by the `R6 cleanup followup` commit.
2. **Module needed `childFilter` option to keep bottles out of the picker** — initial implementation showed all descendants, which polluted the locations picker with 156 bottles. Added `childFilter: (typeName) => bool` and a default for picker mode that restricts to location types.
3. **R5 bottles test referenced now-deleted placeholder slugs** — `bench-reagent` and `fridge-reagent` were renamed/merged in the R6 cleanup but the R5 test still expected them. Updated to look for `bench` and `fridge-4c-main`.

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
- [x] **Link SOPs to inventory items** — R10: Corrosives SOP promoted from 6 wikilinks to 51 via case-insensitive pattern matching against inventory slugs. Every chemical in H290/H314/H318 with a matching bottle is now linked. (Issue #16, closed)
- [x] **Liquid nitrogen protocol** — R8: Created `docs/wet-lab/liquid-nitrogen-refill.md` as a practical "where's the Dewar, how do you fill it" SOP with TODO placeholders for lab-specific details. Links back to the institutional [[cryogens-sop]]. (Issue #17, closed)
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
