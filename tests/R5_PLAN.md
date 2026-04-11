# R5 Plan — Concepts vs. Instances

**Status:** not started. R1-R4 are complete and deployed. See `tests/STATUS.md` § Round 1-4 for what shipped.

## The problem

Reagents like "Ethanol" are currently single markdown files (`docs/resources/ethanol.md`) with a `containers:` array in the frontmatter listing individual bottles:

```yaml
containers:
  - location: "Freezer -80C"
    quantity: 10
    unit: "each"
    lot: "ABC123"
    expiration: "2027-12-31"
```

This compromise doesn't scale because:

- Individual bottles can't have their own `parent:` (specific shelf or box) or `position:` (cell in a grid).
- Bottles aren't visible in the lab-map tree view — they live as JSON rows inside a parent reagent file, not as first-class hierarchy nodes.
- Wikilinks can't point at a specific bottle. `[[Ethanol]]` always means the concept.
- Lot tracking, partial use, transfers between locations all collapse onto the parent reagent.

The pistachio sample model (R1) does this correctly: `samples/sample-pistachio-4.md` is the **concept**, and each physical tube (`locations/tube-pistachio-leaf-1.md`, etc.) is an **instance** with its own parent + position. The instances reference the concept via wikilink.

## R5 = port the same model to reagents/stocks

**Concept** = the existing `docs/resources/ethanol.md`. Stays as-is, contains SDS, description, default storage advice, hazard info.

**Instance** = a new first-class object per physical bottle. Probably a new type like `reagent_bottle` or `bottle`, with frontmatter:

```yaml
type: bottle
title: "Ethanol (anhydrous, lot ABC123)"
parent: locations/cabinet-flammable-shelf-2
position: B4
of: resources/ethanol         # wikilink to the concept (or just use [[...]] in body)
lot: "ABC123"
expiration: "2027-12-31"
quantity: 1
unit: "each"
acquired: "2025-09-15"
```

The body has notes about this specific bottle (when opened, observed level, contamination, etc.).

The Ethanol concept card's col 3 (backlinks pane, R4) automatically shows every bottle that references it. Inline visibility, no schema duplication.

## Migration

Most reagents have empty or simple `containers:` arrays. A migration script:

1. For each file with a non-empty `containers:` array
2. For each entry in the array
3. Create a new `docs/stocks/bottle-{slug}-{shortid}.md` (or similar) with:
   - `type: bottle`
   - `title: "{ConceptTitle}{lot ? ' lot ' + lot : ''}"`
   - `of: {original-slug}` (frontmatter pointer)
   - Body: `Bottle of [[{original-slug}]]. Lot {lot}, expires {expiration}.`
   - Migrate `location` → try to map to a known location object via fuzzy match against the lab-map hierarchy. If no match, leave as a free-text field for manual cleanup.
4. Optionally: leave `containers:` array intact in the original reagent file as a fallback during transition, OR clear it and let backlinks be the source of truth.

Dry-run + apply, like `migrate-location-detail.py` in R1.

## Open design questions to resolve at R5 start

1. **New type or reuse?** Add a `bottle` type to types.js (with its own icon/color), or use the existing `consumable` type with `parent:` set? **My lean:** new `bottle` type — semantically distinct, easier to filter/group, can have its own field schema.
2. **`of:` vs body wikilink** — store the concept reference in frontmatter as a structured field, in the body as prose, or both? **My lean:** both. Frontmatter for queryability + col 3 backlinks; body wikilink for natural prose.
3. **Where do bottle files live?** `docs/stocks/`, `docs/resources/`, or a new `docs/bottles/`? **My lean:** `docs/stocks/` since they're individual physical instances tracked over time, same as `bl21-de3-competent-cells.md`.
4. **Migration mapping for `location:` field** — most existing `location:` strings are like "Freezer -80C" or "Chemical Cabinet". The hierarchy doesn't have those as objects yet (other than `freezer-minus80-a` which the R1 migration created). Two options:
   - **(a)** Generate new location objects for every unique `location:` string seen, and parent the bottles under them.
   - **(b)** Leave the bottles parentless and let Grey assign parents manually via the parent autocomplete.
   - My lean: **(a)** but with a manifest that lists every auto-created location so Grey can review and merge.
5. **Quantity tracking** — bottle has `quantity: 1` always, or can it have partial values (e.g. "3/4 full")? **My lean:** simple integer count for discrete bottles, optional `level: "3/4"` text field for partial.

## Suggested R5 sub-phases

| # | Phase | Notes |
|---|---|---|
| 1 | Add `bottle` type to types.js | icon, color, schema (parent, position, of, lot, expiration, quantity, unit, acquired) |
| 2 | Update build-object-index.py + INDEX_KEYS for the new fields (`of`, `lot`, `expiration`, `acquired`) |
| 3 | Update backlinks pane to also include `of:` frontmatter references, not just `[[wikilinks]]` |
| 4 | Migration script `scripts/migrate-containers-to-bottles.py` with --dry-run + --apply |
| 5 | Run dry-run, review report, refine fuzzy matching, apply |
| 6 | Update inventory page so the table shows bottles (instances) underneath the concept |
| 7 | Tests: bottle type loads, backlinks pane shows bottles for ethanol, migration preserves all original `containers:` data, lab-map tree shows bottles under their assigned shelves |
| 8 | Commit, deploy, screenshot, checkpoint |

## What R5 explicitly does NOT include

- Locations hierarchy picker for the "Locations" insert pill — small polish, R6 if not in R5.
- Ambiguous wikilink rendering — cosmetic, R6.
- Drag-and-drop in grid — R6+.
- Slash commands in notebook editor — Grey said the `[[` autocomplete might be enough; revisit only if real use shows it isn't.

## Files to read first when starting R5

1. `tests/STATUS.md` § Round 1-4 — full canonical writeup of where the system stands
2. `app/js/types.js` — type registry + schema patterns to copy for `bottle`
3. `scripts/migrate-location-detail.py` — template for the new migration script
4. `docs/samples/sample-pistachio-4.md` + `docs/locations/tube-pistachio-leaf-1.md` — the concept/instance pair that R5 mirrors
5. `app/js/editor-modal.js` `renderContents()` and `fetchBacklinksFor()` — where to plug in the bottle visibility
