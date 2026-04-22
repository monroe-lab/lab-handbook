#!/usr/bin/env python3
"""Build docs/object-index.json from frontmatter in all object markdown files.

Walks known object directories, extracts YAML frontmatter, and writes a single
JSON index used by the editor and rendered site for search and popup cards.
"""

import json
import re
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
OUTPUT = DOCS_DIR / "object-index.json"
LINK_OUTPUT = DOCS_DIR / "link-index.json"

WIKILINK_RE = re.compile(r"\[\[([^\[\]\|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]")

# Directories to scan for objects (relative to docs/)
OBJECT_DIRS = [
    "resources",
    "stocks",
    "people",
    "projects",
    "wet-lab",
    "wet-lab/extraction",
    "wet-lab/library-prep",
    "wet-lab/epigenomics",
    "wet-lab/mutagenesis",
    "bioinformatics",
    "lab-management",
    "lab-safety",
    "workflow-templates",
    "notebooks",
    "waste",
    "samples",
    "accessions",
    "locations",
    "events",
    "plant-harvesting",
    "shipping",
]

# Frontmatter keys to extract (all optional except type and title)
EXTRACT_KEYS = [
    "type", "title", "location", "location_detail", "quantity", "unit", "low_stock_threshold",
    "category", "cas", "notes", "role", "email", "organism", "stock_type",
    "source", "genotype", "status", "pi", "funding", "date", "author",
    "legacy_inventory_id", "containers", "need_more",
    "contents", "physical_state", "container", "hazard_class", "started", "waste_tag",
    "created_at", "created_by", "updated_at",
    "sample_id", "species", "lead", "sequencing_type",
    # Accession tracker fields (R18: samples.json migrated to docs/accessions/*.md)
    "accession_id", "priority", "current_blocker", "detail_sheet_link", "last_updated",
    # Instance (sample/extraction/library/pool) fields
    "tissue_type", "collection_date", "collected_by",
    "extraction_type", "extraction_method", "concentration", "volume", "quality_score",
    "prep_kit", "insert_size", "molarity", "pool_date",
    # Hierarchy fields — every object may declare where it sits in the location tree.
    # `parent` is a slug (or [[wikilink]] — brackets stripped client-side).
    # `position` is a grid cell label (e.g. "A1", "3,5") meaningful when the parent has a `grid`.
    # `grid` declares this object is itself a grid container, e.g. "10x10", "8x12".
    # `label_1` / `label_2` are display labels; label_2 is used for compact grid cells.
    "parent", "position", "grid", "label_1", "label_2",
    # R5: bottle (concept/instance) fields. `of` points at the concept slug
    # for a physical bottle/instance; the rest is per-bottle metadata.
    "of", "lot", "expiration", "acquired", "level",
    # Calendar event fields (R17 migration from schedule.json to markdown)
    "date", "start_time", "end_time", "member",
    # Recurrence grouping for events created as a series (issue #104). All
    # occurrences share the same recurrence_id so the editor can offer a
    # "delete entire series" option.
    "recurrence_id",
]

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def parse_frontmatter(text: str) -> dict | None:
    """Parse YAML frontmatter from markdown text using PyYAML so nested
    structures (e.g. containers:) are preserved."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None
    if not isinstance(data, dict):
        return None
    if not data.get("type") or data.get("type") == "index":
        return None
    return data


def infer_type_from_path(path: str) -> str | None:
    """Infer object type from directory path for files without frontmatter."""
    # Bioinformatics, workflow templates, and lab-management are guides
    # (tutorials, blog posts, reference material). Wet-lab and lab-safety
    # files are real bench protocols / SOPs.
    if "bioinformatics/" in path or "workflow-templates/" in path or "lab-management/" in path:
        return "guide"
    if "wet-lab/" in path or "lab-safety/" in path or "plant-harvesting/" in path or "shipping/" in path:
        return "protocol"
    if "notebooks/" in path:
        return "notebook"
    return None


def get_git_mtimes() -> dict[str, int]:
    """Return {'docs/path.md': unix_timestamp} for every tracked markdown file.
    Runs a single `git log` pass so we don't shell out per file.
    Used by inventory.html (R7 #27) to rank items by most-recent edit.
    """
    import subprocess
    try:
        # --diff-filter=d drops deletions; --name-only + %x00 separator lets
        # us parse cheaply. We walk commits oldest → newest so the LAST time
        # we see a path wins, giving us the most recent commit that touched it.
        out = subprocess.run(
            ["git", "log", "--reverse", "--name-only", "--pretty=format:COMMIT:%at", "--diff-filter=AM", "--", "docs/"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if out.returncode != 0:
            return {}
    except Exception:
        return {}
    mtimes: dict[str, int] = {}
    cur_ts = 0
    for line in out.stdout.splitlines():
        if not line:
            continue
        if line.startswith("COMMIT:"):
            try:
                cur_ts = int(line.split(":", 1)[1])
            except ValueError:
                cur_ts = 0
        elif cur_ts and line.endswith(".md"):
            mtimes[line] = cur_ts
    return mtimes


def build_index():
    index = []
    seen_paths = set()
    mtimes = get_git_mtimes()

    for dir_rel in OBJECT_DIRS:
        dir_path = DOCS_DIR / dir_rel
        if not dir_path.is_dir():
            continue

        # Projects and notebooks recurse into subfolders (both have folder-tree
        # structure: projects are nested like protocols, notebooks are scoped
        # per-user like `notebooks/barb-m/2026-04-01.md`). Other object dirs
        # stay flat.
        glob_pattern = "**/*.md" if dir_rel in ("projects", "notebooks") else "*.md"
        for md_file in sorted(dir_path.glob(glob_pattern)):
            # Skip index/template files
            if md_file.name.startswith("_"):
                continue

            rel_path = str(md_file.relative_to(DOCS_DIR))
            if rel_path in seen_paths:
                continue
            seen_paths.add(rel_path)

            text = md_file.read_text(errors="replace")
            fm = parse_frontmatter(text)

            # R7 #27: attach git mtime so the frontend can rank by recency.
            git_path = "docs/" + rel_path
            mt = mtimes.get(git_path)

            if fm:
                entry = {"path": rel_path}
                for key in EXTRACT_KEYS:
                    if key in fm:
                        entry[key] = fm[key]
                if mt:
                    entry["mtime"] = mt
                index.append(entry)
            else:
                # Files without frontmatter: infer type if possible, use filename as title
                inferred = infer_type_from_path(rel_path)
                if inferred:
                    title = md_file.stem.replace("-", " ").replace("_", " ").title()
                    # Try to get the first H1 heading as title
                    for line in text.splitlines()[:5]:
                        if line.startswith("# "):
                            title = line[2:].strip()
                            break
                    entry = {
                        "path": rel_path,
                        "type": inferred,
                        "title": title,
                    }
                    if mt:
                        entry["mtime"] = mt
                    index.append(entry)

    # PyYAML parses unquoted YYYY-MM-DD values as datetime.date (and
    # likewise for times). Coerce to ISO strings so json.dump doesn't
    # blow up on migrated frontmatter that omits quotes around dates.
    def _json_default(o):
        from datetime import date, datetime, time
        if isinstance(o, (datetime, date, time)):
            return o.isoformat()
        raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

    with open(OUTPUT, "w") as f:
        json.dump(index, f, indent=2, default=_json_default)

    print(f"Built object index: {len(index)} entries -> {OUTPUT.relative_to(ROOT)}")

    # Summary by type
    types = {}
    for entry in index:
        t = entry.get("type", "unknown")
        types[t] = types.get(t, 0) + 1
    for t, count in sorted(types.items()):
        print(f"  {t}: {count}")


def build_link_index():
    """Walk every .md file under docs/, parse [[wikilinks]], emit edges.

    Resolves a wikilink by:
      1. Exact match on path-without-extension (e.g. [[wet-lab/pcr]])
      2. Basename match against any .md (e.g. [[pcr]] -> wet-lab/pcr.md)
    Drops links that don't resolve, self-links, and duplicates.
    """
    # Build basename -> [relpath] map and exact-path set
    by_basename: dict[str, list[str]] = {}
    all_paths: set[str] = set()
    for md_file in DOCS_DIR.rglob("*.md"):
        rel = str(md_file.relative_to(DOCS_DIR))
        slug = rel[:-3]  # strip .md
        all_paths.add(slug)
        base = md_file.stem
        by_basename.setdefault(base.lower(), []).append(slug)

    edges = []
    seen_pairs: set[tuple[str, str]] = set()

    for md_file in sorted(DOCS_DIR.rglob("*.md")):
        rel = str(md_file.relative_to(DOCS_DIR))
        source_slug = rel[:-3]
        try:
            text = md_file.read_text(errors="replace")
        except OSError:
            continue
        # Strip frontmatter so we don't pick up wikilinks in YAML (unlikely but safe)
        text = FRONTMATTER_RE.sub("", text, count=1)

        for match in WIKILINK_RE.finditer(text):
            target_raw = match.group(1).strip()
            if not target_raw:
                continue
            # Strip any leading ./ or trailing .md
            target = target_raw.lstrip("./").rstrip("/")
            if target.endswith(".md"):
                target = target[:-3]

            target_slug = None
            # 1. Exact path match
            if target in all_paths:
                target_slug = target
            else:
                # 2. Basename match (case-insensitive)
                base = target.split("/")[-1].lower()
                candidates = by_basename.get(base)
                if candidates:
                    # Prefer one whose path contains the parent hint, if given
                    if "/" in target:
                        for c in candidates:
                            if c.endswith(target):
                                target_slug = c
                                break
                    target_slug = target_slug or candidates[0]

            if not target_slug or target_slug == source_slug:
                continue
            pair = (source_slug, target_slug)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            edges.append({"source": source_slug, "target": target_slug})

    def _json_default(o):
        from datetime import date, datetime, time
        if isinstance(o, (datetime, date, time)):
            return o.isoformat()
        raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

    with open(LINK_OUTPUT, "w") as f:
        json.dump(edges, f, indent=2, default=_json_default)
    print(f"Built link index: {len(edges)} edges -> {LINK_OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build_index()
    build_link_index()
