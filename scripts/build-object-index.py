#!/usr/bin/env python3
"""Build docs/object-index.json from frontmatter in all object markdown files.

Walks known object directories, extracts YAML frontmatter, and writes a single
JSON index used by the editor and rendered site for search and popup cards.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
OUTPUT = DOCS_DIR / "object-index.json"

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
    "notebooks",
]

# Frontmatter keys to extract (all optional except type and title)
EXTRACT_KEYS = [
    "type", "title", "location", "quantity", "unit", "low_stock_threshold",
    "category", "cas", "notes", "role", "email", "organism", "stock_type",
    "source", "genotype", "status", "pi", "funding", "date", "author",
    "legacy_inventory_id",
]

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def parse_frontmatter(text: str) -> dict | None:
    """Parse YAML frontmatter from markdown text. Simple key: value parser."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None

    data = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        # Strip quotes
        if value and value[0] in ('"', "'") and value[-1] == value[0]:
            value = value[1:-1]
        # Try numeric conversion
        if value.isdigit():
            value = int(value)
        else:
            try:
                value = float(value)
            except ValueError:
                pass
        data[key] = value

    if not data.get("type") or data.get("type") == "index":
        return None
    return data


def infer_type_from_path(path: str) -> str | None:
    """Infer object type from directory path for files without frontmatter."""
    if "wet-lab/" in path or "bioinformatics/" in path or "lab-management/" in path:
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

        for md_file in sorted(dir_path.glob("*.md")):
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


if __name__ == "__main__":
    build_index()
