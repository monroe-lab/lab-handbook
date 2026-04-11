#!/usr/bin/env python3
"""Migrate legacy `location_detail` strings into the new parent/position hierarchy.

Walks every markdown file under docs/ and looks for frontmatter with the old
`location_detail` string (format: "Shelf N / Box L / CellAN"). For each match:

  1. Determine the parent freezer/fridge slug from the `location` field.
     - "Freezer -80C"  → locations/freezer-minus80-a  (reuses the seed object)
     - "Freezer -20C"  → locations/freezer-minus20
     - "Refrigerator"  → locations/fridge-4c-main     (reuses seed)
     - Anything else   → SKIPPED, location_detail preserved (manual cleanup)
  2. Create (or reuse) a shelf object:   locations/shelf-<freezer>-<N>.md
  3. Create (or reuse) a box object:     locations/box-<shelf>-<L>.md  (grid 9x9 to match legacy)
  4. Rewrite the item's frontmatter:
       parent: locations/box-<shelf>-<L>
       position: <cell>
     and REMOVE the old `location_detail` key.

The auto-created shelf/box objects all ultimately chain up to
locations/room-robbins-0170 via freezer-minus80-a or fridge-4c-main, which
already exist in the seed. New freezers (like -20C) are created with
parent=locations/room-robbins-0170.

Usage:
  python3 scripts/migrate-location-detail.py           # dry run — prints plan
  python3 scripts/migrate-location-detail.py --apply   # writes files

Idempotent: running again after apply is a no-op (no items left with
location_detail).
"""

import argparse
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
LOCATIONS_DIR = DOCS / "locations"

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
LOC_DETAIL_RE = re.compile(r"Shelf\s+(\d+)\s*/\s*Box\s+([A-Z])\s*/\s*([A-Z]\d+)", re.IGNORECASE)

# Maps the free-text `location` field in existing items to a freezer slug.
# Keys are case-insensitive substrings (first match wins).
FREEZER_MAP = [
    ("freezer -80", "freezer-minus80-a"),  # reuses seed
    ("-80c",         "freezer-minus80-a"),
    ("freezer -20", "freezer-minus20"),
    ("-20c",         "freezer-minus20"),
    ("refrigerator","fridge-4c-main"),     # reuses seed
    ("fridge",       "fridge-4c-main"),
]

FREEZER_META = {
    "freezer-minus80-a": {"type": "freezer", "title": "-80C Freezer A", "label_1": "-80C Freezer A"},
    "freezer-minus20":   {"type": "freezer", "title": "-20C Freezer",   "label_1": "-20C Freezer"},
    "fridge-4c-main":    {"type": "fridge",  "title": "4C Fridge (Main)","label_1": "Main 4C Fridge"},
}


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        return None, text
    if not isinstance(meta, dict):
        return None, text
    body = text[m.end():]
    return meta, body


def dump_frontmatter(meta, body):
    # Preserve insertion order; PyYAML default_flow_style=False is block style.
    y = yaml.safe_dump(meta, sort_keys=False, allow_unicode=True, default_flow_style=False)
    return "---\n" + y + "---\n" + body


def resolve_freezer_slug(location_field):
    if not location_field:
        return None
    l = str(location_field).lower()
    for sub, slug in FREEZER_MAP:
        if sub in l:
            return slug
    return None


def ensure_location_object(slug, fm_meta, body_text, plan, apply, created):
    """Create a location object under docs/locations/<slug>.md if missing."""
    if slug in created:
        return  # already ensured this run
    path = LOCATIONS_DIR / f"{slug}.md"
    if path.exists():
        created.add(slug)
        return
    plan.append(("create", path.relative_to(ROOT), fm_meta.get("type", "?")))
    if apply:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(dump_frontmatter(fm_meta, body_text))
    created.add(slug)


def ensure_freezer(slug, plan, apply, created):
    if slug in created or (LOCATIONS_DIR / f"{slug}.md").exists():
        created.add(slug)
        return
    meta = dict(FREEZER_META.get(slug, {"type": "freezer", "title": slug}))
    meta["parent"] = "locations/room-robbins-0170"
    body = f"\n# {meta['title']}\n\nAuto-created by migrate-location-detail.py. Edit or delete if unneeded.\n"
    ensure_location_object(slug, meta, body, plan, apply, created)


def ensure_shelf(freezer_slug, shelf_num, plan, apply, created):
    # Use the same slug convention as the seed: shelf-minus80-a-1
    shelf_slug = f"shelf-{freezer_slug.replace('freezer-', '').replace('fridge-', '')}-{shelf_num}"
    shelf_slug_full = f"shelf-{freezer_slug.replace('freezer-', '').replace('fridge-', '')}-{shelf_num}"
    slug = shelf_slug_full
    if slug in created or (LOCATIONS_DIR / f"{slug}.md").exists():
        created.add(slug)
        return slug
    ensure_freezer(freezer_slug, plan, apply, created)
    meta = {
        "type": "shelf",
        "title": f"Shelf {shelf_num}",
        "parent": f"locations/{freezer_slug}",
        "label_1": f"Shelf {shelf_num}",
    }
    body = f"\n# Shelf {shelf_num}\n\nAuto-created by migrate-location-detail.py. Edit or delete if unneeded.\n"
    ensure_location_object(slug, meta, body, plan, apply, created)
    return slug


def ensure_box(shelf_slug, box_letter, plan, apply, created):
    box_slug = f"box-{shelf_slug.replace('shelf-', '')}-{box_letter.lower()}"
    if box_slug in created or (LOCATIONS_DIR / f"{box_slug}.md").exists():
        created.add(box_slug)
        return box_slug
    meta = {
        "type": "box",
        "title": f"Box {box_letter}",
        "parent": f"locations/{shelf_slug}",
        "grid": "9x9",  # matches legacy 9x9 cells
        "label_1": f"Box {box_letter}",
        "label_2": f"Bx{box_letter}",
    }
    body = (
        f"\n# Box {box_letter}\n\n"
        "Auto-created by migrate-location-detail.py to hold legacy items that "
        "referenced this slot via `location_detail` strings.\n\n"
        "Edit, rename, or merge with other boxes as needed — items inside reference "
        "this box by its slug.\n"
    )
    ensure_location_object(box_slug, meta, body, plan, apply, created)
    return box_slug


def find_candidates():
    """Walk docs/ for files with location_detail in frontmatter."""
    out = []
    for md in sorted(DOCS.rglob("*.md")):
        try:
            text = md.read_text(errors="replace")
        except OSError:
            continue
        meta, body = parse_frontmatter(text)
        if not meta or "location_detail" not in meta:
            continue
        out.append((md, meta, body))
    return out


def migrate(apply=False):
    plan = []
    created = set()
    updates = []   # (path, meta, body) with new frontmatter
    skipped = []

    candidates = find_candidates()
    print(f"Scanning — {len(candidates)} files with location_detail")

    for md, meta, body in candidates:
        detail = meta.get("location_detail")
        m = LOC_DETAIL_RE.search(str(detail))
        if not m:
            skipped.append((md, detail, "unparseable"))
            continue

        shelf_num = int(m.group(1))
        box_letter = m.group(2).upper()
        cell = m.group(3).upper()

        freezer_slug = resolve_freezer_slug(meta.get("location"))
        if not freezer_slug:
            skipped.append((md, detail, f"unknown location: {meta.get('location')!r}"))
            continue

        shelf_slug = ensure_shelf(freezer_slug, shelf_num, plan, apply, created)
        box_slug = ensure_box(shelf_slug, box_letter, plan, apply, created)

        new_meta = dict(meta)  # preserves order
        new_meta["parent"] = f"locations/{box_slug}"
        new_meta["position"] = cell
        new_meta.pop("location_detail", None)
        updates.append((md, new_meta, body))
        plan.append(("update", md.relative_to(ROOT),
                     f"parent=locations/{box_slug}, position={cell}"))

    print()
    print("=== Plan ===")
    creates = [p for p in plan if p[0] == "create"]
    writes  = [p for p in plan if p[0] == "update"]
    for p in creates:
        print(f"  CREATE {p[1]}  [{p[2]}]")
    for p in writes:
        print(f"  UPDATE {p[1]}  [{p[2]}]")
    print()
    print(f"  Creates: {len(creates)}   Updates: {len(writes)}   Skipped: {len(skipped)}")
    if skipped:
        print()
        print("=== Skipped ===")
        for md, detail, reason in skipped:
            print(f"  {md.relative_to(ROOT)}  ({reason}): {detail}")

    if not apply:
        print()
        print("(dry run — re-run with --apply to write)")
        return

    # Apply updates to existing items
    for md, meta, body in updates:
        md.write_text(dump_frontmatter(meta, body))
    print()
    print(f"Applied {len(updates)} item updates + created {len(creates)} location objects.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Write changes (default is dry run)")
    args = ap.parse_args()
    migrate(apply=args.apply)


if __name__ == "__main__":
    main()
