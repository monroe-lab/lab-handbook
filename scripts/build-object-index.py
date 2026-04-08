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
]

# Frontmatter keys to extract (all optional except type and title)
EXTRACT_KEYS = [
    "type", "title", "location", "quantity", "unit", "low_stock_threshold",
    "category", "cas", "notes", "role", "email", "organism", "stock_type",
    "source", "genotype", "status", "pi", "funding", "date", "author",
    "legacy_inventory_id", "containers", "need_more",
    "created_at", "created_by", "updated_at",
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
    if "wet-lab/" in path or "bioinformatics/" in path or "lab-management/" in path or "lab-safety/" in path or "workflow-templates/" in path:
        return "protocol"
    if "notebooks/" in path:
        return "notebook"
    return None


def build_index():
    index = []
    seen_paths = set()

    for dir_rel in OBJECT_DIRS:
        dir_path = DOCS_DIR / dir_rel
        if not dir_path.is_dir():
            continue

        # Projects recurse into subfolders (folder-tree structure like protocols);
        # other object dirs stay flat.
        glob_pattern = "**/*.md" if dir_rel == "projects" else "*.md"
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

            if fm:
                entry = {"path": rel_path}
                for key in EXTRACT_KEYS:
                    if key in fm:
                        entry[key] = fm[key]
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
                    index.append({
                        "path": rel_path,
                        "type": inferred,
                        "title": title,
                    })

    with open(OUTPUT, "w") as f:
        json.dump(index, f, indent=2)

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

    with open(LINK_OUTPUT, "w") as f:
        json.dump(edges, f, indent=2)
    print(f"Built link index: {len(edges)} edges -> {LINK_OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build_index()
    build_link_index()
