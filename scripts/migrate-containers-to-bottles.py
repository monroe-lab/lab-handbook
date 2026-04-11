#!/usr/bin/env python3
"""R5: Migrate `containers:` arrays into first-class `bottle` objects.

Reagent and stock concept files (`docs/resources/*.md`, `docs/stocks/*.md`)
historically tracked physical instances inline as a `containers:` array in
their YAML frontmatter:

  containers:
    - location: Flammable Cabinet
      quantity: 1
      unit: each

This compromise doesn't scale: bottles can't have their own parent/position,
can't be referenced by wikilink, and can't carry per-bottle lot/expiration
metadata. R5 promotes each container entry into a separate `bottle` markdown
object under `docs/stocks/bottle-<slug>-N.md` with its own frontmatter:

  ---
  type: bottle
  title: "<Concept Title>"
  of: resources/<concept-slug>
  parent: locations/<placeholder-slug>   # mapped from container.location string
  quantity: 500
  unit: g
  expiration: 2026-04-07                 # if originally present
  ---
  Bottle of [[resources/<concept-slug>]].

Existing `location:` strings (only 7 unique values across the dataset) get
mapped to placeholder location objects under `docs/locations/`. The script
auto-creates those placeholders the first time they're needed. Grey can
rename, merge, or re-parent them later via the editor — it's a one-line
frontmatter edit and the bottles' `parent:` slugs stay valid.

Usage:
  python3 scripts/migrate-containers-to-bottles.py             # dry run
  python3 scripts/migrate-containers-to-bottles.py --apply     # write

Idempotent: re-running after --apply is a no-op (no concept files left with
non-empty `containers:` arrays).
"""

import argparse
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
RESOURCES_DIR = DOCS / "resources"
STOCKS_DIR = DOCS / "stocks"
LOCATIONS_DIR = DOCS / "locations"

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.DOTALL)

# Map container.location strings → (placeholder slug, location type, title).
# Keys matched case-insensitively. Order matters; first hit wins.
LOCATION_MAP = [
    ("freezer -80",       ("freezer-minus80-a",  "freezer",   "-80C Freezer A")),  # reuses R1 seed
    ("-80c",              ("freezer-minus80-a",  "freezer",   "-80C Freezer A")),
    ("flammable",         ("cabinet-flammable",  "container", "Flammable Cabinet")),
    ("corrosive",         ("cabinet-corrosive",  "container", "Corrosive Cabinet")),
    ("hazardous",         ("cabinet-hazardous",  "container", "Hazardous Cabinet")),
    ("chemical",          ("cabinet-chemical",   "container", "Chemical Cabinet")),
    ("refrigerator",      ("fridge-reagent",     "fridge",    "Reagent Refrigerator")),
    ("fridge",            ("fridge-reagent",     "fridge",    "Reagent Refrigerator")),
    ("bench",             ("bench-reagent",      "container", "Reagent Bench")),
    ("other",             ("location-unsorted",  "container", "Unsorted (review)")),
]

# Default placeholder for container entries with no location string at all.
DEFAULT_LOCATION = ("location-unsorted", "container", "Unsorted (review)")


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
    return meta, text[m.end():]


def dump_frontmatter(meta, body):
    y = yaml.safe_dump(meta, sort_keys=False, allow_unicode=True, default_flow_style=False)
    return "---\n" + y + "---\n" + body


def resolve_location(location_str):
    if not location_str:
        return DEFAULT_LOCATION
    s = str(location_str).lower()
    for sub, target in LOCATION_MAP:
        if sub in s:
            return target
    return DEFAULT_LOCATION


def ensure_placeholder_location(slug, type_, title, plan, apply, created):
    """Create docs/locations/<slug>.md if it doesn't already exist."""
    if slug in created:
        return
    path = LOCATIONS_DIR / f"{slug}.md"
    if path.exists():
        created.add(slug)
        return
    meta = {
        "type": type_,
        "title": title,
        "label_1": title,
    }
    body = (
        f"\n# {title}\n\n"
        "Auto-created by `migrate-containers-to-bottles.py` (R5) as a placeholder "
        "parent for migrated bottle objects. Rename, re-parent, or merge with a "
        "more specific location at any time — bottles inside reference this slug, "
        "so renaming the title is safe.\n"
    )
    plan.append(("create-location", path.relative_to(ROOT), f"{type_}: {title}"))
    if apply:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(dump_frontmatter(meta, body))
    created.add(slug)


def find_concepts():
    """Walk concept dirs for files with non-empty `containers:` arrays."""
    out = []
    for d in (RESOURCES_DIR, STOCKS_DIR):
        if not d.is_dir():
            continue
        for md in sorted(d.glob("*.md")):
            try:
                text = md.read_text(errors="replace")
            except OSError:
                continue
            meta, body = parse_frontmatter(text)
            if not meta:
                continue
            containers = meta.get("containers")
            if not isinstance(containers, list) or len(containers) == 0:
                continue
            out.append((md, meta, body))
    return out


def make_bottle_filename(concept_basename, n_total, idx, taken):
    """Return a unique bottle slug.

    For single-bottle concepts: `bottle-<concept>.md`.
    For multi-bottle concepts: `bottle-<concept>-1.md`, `-2.md`, etc.
    Falls back to numeric suffix if a name collision occurs across concepts.
    """
    base = f"bottle-{concept_basename}"
    if n_total > 1:
        base = f"{base}-{idx + 1}"
    candidate = f"{base}.md"
    if candidate not in taken and not (STOCKS_DIR / candidate).exists():
        taken.add(candidate)
        return candidate
    # Collision: append a numeric suffix
    k = 2
    while True:
        candidate = f"{base}-{k}.md"
        if candidate not in taken and not (STOCKS_DIR / candidate).exists():
            taken.add(candidate)
            return candidate
        k += 1


def build_bottle(concept_meta, concept_slug, container_entry):
    """Build (meta, body) for a new bottle file."""
    title = concept_meta.get("title") or concept_slug.split("/")[-1]
    meta = {
        "type": "bottle",
        "title": title,
        "of": concept_slug,
    }
    placeholder_slug, _, _ = resolve_location(container_entry.get("location"))
    meta["parent"] = f"locations/{placeholder_slug}"

    # Carry-over fields, only when present in the source.
    for key in ("quantity", "unit", "lot", "expiration", "acquired", "level"):
        if key in container_entry and container_entry[key] not in (None, ""):
            meta[key] = container_entry[key]

    body_lines = [
        "",
        f"# {title}",
        "",
        f"Bottle of [[{concept_slug}]].",
    ]
    if container_entry.get("location"):
        body_lines.append("")
        body_lines.append(
            f"Migrated from inline `containers:` entry "
            f"(original location: {container_entry['location']!r})."
        )
    body_lines.append("")
    return meta, "\n".join(body_lines)


def migrate(apply=False):
    plan = []         # list of (op, path, summary) for printing
    created_locs = set()
    taken_filenames = set()
    bottles_to_write = []   # (path, meta, body)
    concepts_to_clean = []  # (path, new_meta, body)

    concepts = find_concepts()
    print(f"Scanning — {len(concepts)} concept files with non-empty containers")

    for md, meta, body in concepts:
        # concept_slug is "resources/ethanol-absolute" form
        rel = md.relative_to(DOCS)
        concept_slug = str(rel.with_suffix(""))
        concept_basename = md.stem

        containers = meta["containers"]
        n = len(containers)

        for idx, entry in enumerate(containers):
            if not isinstance(entry, dict):
                continue
            placeholder = resolve_location(entry.get("location"))
            ensure_placeholder_location(*placeholder, plan=plan, apply=apply, created=created_locs)

            bottle_filename = make_bottle_filename(concept_basename, n, idx, taken_filenames)
            bottle_path = STOCKS_DIR / bottle_filename
            bottle_meta, bottle_body = build_bottle(meta, concept_slug, entry)
            bottles_to_write.append((bottle_path, bottle_meta, bottle_body))
            plan.append((
                "create-bottle",
                bottle_path.relative_to(ROOT),
                f"of={concept_slug}, parent={bottle_meta['parent']}",
            ))

        # Strip containers: from the concept on apply.
        new_meta = {k: v for k, v in meta.items() if k != "containers"}
        concepts_to_clean.append((md, new_meta, body))
        plan.append((
            "clean-concept",
            md.relative_to(ROOT),
            f"strip containers: ({n} entries)",
        ))

    # Print plan grouped by op
    print()
    print("=== Plan ===")
    for op_name in ("create-location", "create-bottle", "clean-concept"):
        rows = [p for p in plan if p[0] == op_name]
        if not rows:
            continue
        print()
        print(f"{op_name.upper()}: {len(rows)}")
        # Limit per-section printing for readability in dry runs
        for r in rows[:8]:
            print(f"  {r[1]}  [{r[2]}]")
        if len(rows) > 8:
            print(f"  ... and {len(rows) - 8} more")

    print()
    n_loc = sum(1 for p in plan if p[0] == "create-location")
    n_bot = sum(1 for p in plan if p[0] == "create-bottle")
    n_cln = sum(1 for p in plan if p[0] == "clean-concept")
    print(f"  Locations to create:  {n_loc}")
    print(f"  Bottles to create:    {n_bot}")
    print(f"  Concepts to clean:    {n_cln}")

    if not apply:
        print()
        print("(dry run — re-run with --apply to write)")
        return

    # Apply: write bottles, then strip containers from concepts.
    for path, bmeta, bbody in bottles_to_write:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(dump_frontmatter(bmeta, bbody))
    for path, new_meta, body in concepts_to_clean:
        path.write_text(dump_frontmatter(new_meta, body))

    print()
    print(f"Applied: {n_loc} locations, {n_bot} bottles, {n_cln} concepts cleaned.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Write changes (default is dry run)")
    args = ap.parse_args()
    migrate(apply=args.apply)


if __name__ == "__main__":
    main()
