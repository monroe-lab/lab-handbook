#!/usr/bin/env python3
"""Convert legacy resource frontmatter (top-level quantity/unit) into a
containers[] list with a single entry. Run once after the schema change.

For each docs/resources/*.md (and docs/stocks/*.md):
  - if containers: already exists, skip
  - if quantity is present, build containers: [{location, quantity, unit}]
    using the top-level location/unit, then drop top-level quantity/unit/
    low_stock_threshold from frontmatter. Top-level location is kept as
    the default location.
"""

import sys
import re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
TARGETS = [ROOT / "docs" / "resources", ROOT / "docs" / "stocks"]
DROP_KEYS = {"quantity", "unit", "low_stock_threshold"}

# Preserve a stable key order in output
KEY_ORDER = [
    "type", "title", "location", "containers",
    "low_stock_threshold", "need_more",
    "cas", "category", "notes", "legacy_inventory_id",
    "created_at", "created_by", "updated_at",
]

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n?(.*)$", re.DOTALL)


class IndentDumper(yaml.SafeDumper):
    """Force list items under a key to be indented (block style with 2-space indent)."""
    def increase_indent(self, flow=False, indentless=False):
        return super().increase_indent(flow, False)


def dump_frontmatter(meta: dict) -> str:
    ordered = {}
    for k in KEY_ORDER:
        if k in meta:
            ordered[k] = meta[k]
    for k, v in meta.items():
        if k not in ordered:
            ordered[k] = v
    return yaml.dump(
        ordered,
        Dumper=IndentDumper,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
        indent=2,
    ).rstrip()


def process(path: Path) -> bool:
    text = path.read_text()
    m = FRONTMATTER_RE.match(text)
    if not m:
        return False
    meta = yaml.safe_load(m.group(1)) or {}
    body = m.group(2)

    if not isinstance(meta, dict):
        return False
    if "containers" in meta and meta["containers"]:
        return False  # already migrated
    if "quantity" not in meta:
        return False  # nothing to migrate

    container = {"location": meta.get("location", "")}
    if meta.get("quantity") not in (None, ""):
        container["quantity"] = meta["quantity"]
    if meta.get("unit"):
        container["unit"] = meta["unit"]
    # drop empty location key from container if no value
    if not container.get("location"):
        container.pop("location")

    meta["containers"] = [container]
    for k in DROP_KEYS:
        meta.pop(k, None)

    new_text = "---\n" + dump_frontmatter(meta) + "\n---\n" + body
    path.write_text(new_text)
    return True


def main():
    changed = 0
    scanned = 0
    for target in TARGETS:
        if not target.exists():
            continue
        for md in sorted(target.rglob("*.md")):
            scanned += 1
            if process(md):
                changed += 1
                print(f"  migrated {md.relative_to(ROOT)}")
    print(f"\n{changed}/{scanned} files migrated")


if __name__ == "__main__":
    main()
