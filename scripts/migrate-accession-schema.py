#!/usr/bin/env python3
"""R20 schema migration: generalize accessions, promote biological stocks.

What changes:
  1. Biological stocks (type ∈ {seed, plasmid, glycerol_stock, agro_strain,
     dna_prep}) move from docs/stocks/ to docs/accessions/ with
     `type: accession`. The old type is preserved as `legacy_stock_type`
     so the origin stays searchable. `organism` → `species` (where present).

  2. Every accession file gets its status + priority remapped:
       status (14 old pipeline values) → one of: active, waiting,
         completed, archived. Old value is stashed in `status_note` so
         no context is lost.
       priority: ⭐ → 3 stars, 💎 → 2, 🌾 → 1, '' → 0.

  3. Rename `lead` → `people` (value unchanged — users can wikilink-tag
     manually afterward).

  4. Chemical type re-triage (#156): `sucrose` → reagent. Hydrochloric
     acid + liquid nitrogen stay as chemical (both warrant EHS handling).

  5. RNase rename (#155): `resources/rnase-aliquot.md` → `resources/
     rnase.md`, title "RNase". Any `of: resources/rnase-aliquot` or
     body wikilink rewritten.

Run dry-run first (default), then `--apply` to commit. The wikilink
rewriter mirrors the r19 migration approach.
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
STOCKS_DIR = DOCS / "stocks"
ACCESSIONS_DIR = DOCS / "accessions"
RESOURCES_DIR = DOCS / "resources"

LEGACY_STOCK_TYPES = {"seed", "plasmid", "glycerol_stock", "agro_strain", "dna_prep"}

# Pipeline → broad-bucket mapping for accession status (#160).
STATUS_MAP = {
    "Complete": "completed",
    "Data received": "completed",
    "Submitted": "waiting",
    "Sequencing in progress": "waiting",
    "Not yet received": "waiting",
    "On hold": "waiting",
    "Ready to submit": "active",
    "Shearing": "active",
    "Library prep": "active",
    "DNA extracted": "active",
    "Tissue collected": "active",
    "Tissue available": "active",
    "QC passed": "active",
    "Needs QC": "active",
    "extracted": "active",  # singleton typo from docs/samples origin
}

PRIORITY_MAP = {
    "⭐": "3",
    "💎": "2",
    "🌾": "1",
    "": "0",
}

# #156: chemicals re-triage. Names that stay chemical because they truly are
# EHS-registered; everything else currently `type: chemical` is reclassified
# to `reagent`. Only 3 currently exist, so this is a whitelist.
EHS_KEEP_CHEMICAL = {
    "hydrochloric-acid",
    "liquid-nitrogen",
}


def parse_frontmatter(text: str):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, flags=re.DOTALL)
    if not m:
        return None, text
    try:
        return yaml.safe_load(m.group(1)) or {}, m.group(2)
    except yaml.YAMLError:
        return None, text


def dump_frontmatter(meta: dict) -> str:
    # Stable key order that humans expect, then anything else in insertion order.
    PREFERRED = [
        "type", "title", "accession_id", "project", "people", "lead",
        "species", "organism", "status", "status_note", "current_blocker",
        "priority", "sequencing_type", "detail_sheet_link", "last_updated",
        "legacy_stock_type", "legacy_sample_tracker_id",
        "stock_type", "location", "source", "genotype",
        "created_at", "updated_at", "created_by",
    ]
    ordered = {}
    for k in PREFERRED:
        if k in meta and meta[k] not in (None, ""):
            ordered[k] = meta[k]
    for k, v in meta.items():
        if k in ordered:
            continue
        if v in (None, ""):
            continue
        ordered[k] = v
    # yaml.safe_dump with default_flow_style=False produces tidy multi-line.
    body = yaml.safe_dump(ordered, default_flow_style=False, sort_keys=False, allow_unicode=True)
    return "---\n" + body + "---\n"


def remap_accession_meta(meta: dict) -> dict:
    """Apply the status/priority/people transforms in-place (returns new dict)."""
    out = dict(meta)

    # Status bucket + note
    old_status = (out.get("status") or "").strip()
    new_status = STATUS_MAP.get(old_status)
    if new_status is None:
        # Already-migrated or unrecognized → leave alone if already a bucket.
        if old_status in {"active", "waiting", "completed", "archived"}:
            new_status = old_status
        elif old_status:
            new_status = "active"  # best default
        else:
            new_status = "active"
    out["status"] = new_status

    existing_note = (out.get("status_note") or "").strip()
    if not existing_note:
        # Carry forward old_status (if meaningful) + current_blocker into
        # status_note so the tracker view retains context.
        note_parts = []
        if old_status and old_status not in {"active", "waiting", "completed", "archived"}:
            note_parts.append(old_status)
        if out.get("current_blocker"):
            note_parts.append(str(out["current_blocker"]))
        if note_parts:
            out["status_note"] = " — ".join(note_parts)
    # Drop current_blocker — it's been folded into status_note.
    out.pop("current_blocker", None)

    # Priority emoji → stars
    old_pri = out.get("priority")
    if old_pri is None:
        old_pri = ""
    else:
        old_pri = str(old_pri)
    if old_pri in PRIORITY_MAP:
        out["priority"] = PRIORITY_MAP[old_pri]
    elif old_pri in {"0", "1", "2", "3"}:
        pass  # already migrated
    else:
        out["priority"] = "0"

    # lead → people (rename key, preserve value)
    if "people" not in out and "lead" in out:
        out["people"] = out["lead"]
    out.pop("lead", None)

    return out


def promote_stock_to_accession(path: Path, plan: list, apply: bool, wikilink_remap: dict) -> None:
    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if not meta or meta.get("type") not in LEGACY_STOCK_TYPES:
        return
    old_type = meta["type"]
    slug = path.stem
    new_path = ACCESSIONS_DIR / f"{slug}.md"

    new_meta = dict(meta)
    new_meta["type"] = "accession"
    new_meta["legacy_stock_type"] = old_type
    # organism → species (if no species set)
    if not new_meta.get("species") and new_meta.get("organism"):
        new_meta["species"] = new_meta["organism"]
    # accession_id default: use slug-derived if not present
    if not new_meta.get("accession_id"):
        new_meta["accession_id"] = new_meta.get("title", slug)
    # Strip stock-specific in-stock/out-of-stock statuses — promote to active.
    if new_meta.get("status") in {"in_stock", "needs_more", "out_of_stock", "external"}:
        new_meta["status"] = "active"
    # Apply the accession remapping for consistency
    new_meta = remap_accession_meta(new_meta)

    new_content = dump_frontmatter(new_meta) + ("\n" + body.lstrip("\n") if body.strip() else "\n")
    plan.append(("write", new_path.relative_to(REPO), len(new_content)))
    plan.append(("delete", path.relative_to(REPO), 0))
    # Old `stocks/<slug>` wikilinks redirect to new `accessions/<slug>`.
    wikilink_remap[f"stocks/{slug}"] = f"accessions/{slug}"
    if apply:
        ACCESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        new_path.write_text(new_content, encoding="utf-8")
        path.unlink()


def remap_existing_accessions(plan: list, apply: bool) -> None:
    if not ACCESSIONS_DIR.exists():
        return
    for path in sorted(ACCESSIONS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        if not meta or meta.get("type") != "accession":
            continue
        new_meta = remap_accession_meta(meta)
        if new_meta == meta:
            continue
        new_text = dump_frontmatter(new_meta) + ("\n" + body.lstrip("\n") if body.strip() else "\n")
        plan.append(("rewrite", path.relative_to(REPO), 1))
        if apply:
            path.write_text(new_text, encoding="utf-8")


def retriage_chemicals(plan: list, apply: bool) -> None:
    for path in sorted(RESOURCES_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)
        if not meta or meta.get("type") != "chemical":
            continue
        slug = path.stem
        if slug in EHS_KEEP_CHEMICAL:
            continue  # actual EHS chemical
        new_meta = dict(meta)
        new_meta["type"] = "reagent"
        new_text = dump_frontmatter(new_meta) + ("\n" + body.lstrip("\n") if body.strip() else "\n")
        plan.append(("rewrite", path.relative_to(REPO), 1))
        if apply:
            path.write_text(new_text, encoding="utf-8")


def rename_rnase(plan: list, apply: bool, wikilink_remap: dict) -> None:
    old = RESOURCES_DIR / "rnase-aliquot.md"
    new = RESOURCES_DIR / "rnase.md"
    if not old.exists():
        return
    text = old.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if not meta:
        return
    meta["title"] = "RNase"
    new_text = dump_frontmatter(meta) + ("\n" + body.lstrip("\n") if body.strip() else "\n")
    plan.append(("write", new.relative_to(REPO), len(new_text)))
    plan.append(("delete", old.relative_to(REPO), 0))
    wikilink_remap["resources/rnase-aliquot"] = "resources/rnase"
    if apply:
        new.write_text(new_text, encoding="utf-8")
        old.unlink()


def rewrite_wikilinks(remap: dict, plan: list, apply: bool) -> None:
    """Rewrite wikilinks across the vault for every entry in `remap`."""
    if not remap:
        return
    patterns = [(re.compile(re.escape(old) + r"(?=\b)"), new) for old, new in remap.items()]
    changed_files = 0
    changed_refs = 0
    for md in DOCS.rglob("*.md"):
        # Skip archives
        rel = md.relative_to(DOCS)
        if any(p.startswith("_archive") or p.startswith(".") for p in rel.parts):
            continue
        text = md.read_text(encoding="utf-8")
        new_text = text
        for pat, repl in patterns:
            new_text, n = pat.subn(repl, new_text)
            changed_refs += n
        if new_text != text:
            changed_files += 1
            plan.append(("rewrite", md.relative_to(REPO), 1))
            if apply:
                md.write_text(new_text, encoding="utf-8")
    print(f"  wikilink rewrite: {changed_refs} refs across {changed_files} files")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes (default: dry-run)")
    args = ap.parse_args()

    plan: list = []
    wikilink_remap: dict = {}

    print("R20 migration plan:")

    # 1. Promote biological stocks
    if STOCKS_DIR.exists():
        for p in sorted(STOCKS_DIR.glob("*.md")):
            promote_stock_to_accession(p, plan, args.apply, wikilink_remap)

    # 2. Retriage chemicals
    retriage_chemicals(plan, args.apply)

    # 3. RNase rename
    rename_rnase(plan, args.apply, wikilink_remap)

    # 4. Remap existing accessions (status / priority / lead→people)
    #    Must come AFTER stock promotions so their new files get remapped too.
    remap_existing_accessions(plan, args.apply)

    # 5. Rewrite wikilinks for everything we renamed
    rewrite_wikilinks(wikilink_remap, plan, args.apply)

    writes = sum(1 for op, *_ in plan if op == "write")
    deletes = sum(1 for op, *_ in plan if op == "delete")
    rewrites = sum(1 for op, *_ in plan if op == "rewrite")
    print(f"\nSummary: {writes} writes · {deletes} deletes · {rewrites} rewrites")
    if not args.apply:
        print("(dry-run — re-run with --apply to commit changes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
