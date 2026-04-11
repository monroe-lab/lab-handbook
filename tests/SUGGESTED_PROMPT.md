# Suggested prompt for next session

R1 through R6.5 of the hierarchy/wikilink overhaul are done and deployed. 153/153 Playwright tests green on https://monroe-lab.github.io/lab-handbook/. Issues #18, #19, #20 closed. What shipped across the rounds is documented in `tests/STATUS.md` (scores table at top, then one section per round through Round 6.5).

I want to work on new improvements that came in from GitHub issues.

**Read first, in this order:**

1. Run `gh issue list --repo monroe-lab/lab-handbook --state open` — this is the canonical list of open work. Per the lab-handbook CLAUDE.md, STATUS.md should mirror these; any issue not reflected there needs to be added.
2. `tests/STATUS.md` — current scores table + Round 6.5 section (most recent context). Also scan the "Not yet tested" P0–P4 sections further down.
3. The auto-memory at `project_hierarchy_rounds.md` (loaded automatically) for quick orientation on the design model — especially the "Important callouts for future work" section, which documents three gotchas we hit during R6/R6.5:
   - **Legacy classnames when extracting modules** — emit both new and legacy classnames so CSS + tests keep working.
   - **Create-then-open race** — if you add any "save a file, then immediately open it in the editor" flow, prime `lab_file_cache` first, or the GitHub contents API cache lag will bite you.
   - **Network contention during create flows** — don't add eager fetches in `attach()`-style functions; prefer lazy fetches gated on user action.

**What I want from you:**

1. Read the issue list and STATUS.md.
2. Tell me which issues look like the highest-value next improvements and why. Group them if related.
3. For the one you think I should tackle first, lay out a plan like R5/R6/R6.5: sub-phases, files to touch, design questions to answer before coding.
4. **Don't start coding until we've agreed on what to do.** I'll pick from your list.

When you're ready, ask me to pick an issue to dig into.

---

**Conventions established across R1–R6.5** (in case you need them):

- **Slug = ID, title = label.** Wikilinks store slugs; titles are display-only. Scoped uniqueness check (R6.5) refuses duplicate concept titles within the same type, but instance types (bottle/location) may share with their concept.
- **Concept/instance split.** Reagents and samples are concepts; bottles and tubes are instances. Bottle has `of: <concept-slug>` frontmatter. Col 3 backlinks pane in the editor popup shows instances automatically for concepts.
- **`Lab.locationTree.attach(mount, opts)`** is the single source of truth for rendering location trees — used by `lab-map.html` in `full` mode and by the editor's Insert Link Modal (Locations category) in `picker` mode.
- **Drag-and-drop** — lab-map tree supports cross-parent re-parenting; editor grid supports within-grid position moves. Neither supports swap-on-drop yet.
- **Inventory test is flaky if you touch create-then-edit flows** — see the third callout in the auto-memory. Test currently passes reliably at 7/7 but is sensitive to any new network activity during the create window.
- **Always commit and push** every change so the live site matches local. Tests run against the deployed site, not local files.
