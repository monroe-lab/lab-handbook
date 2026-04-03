#!/usr/bin/env python3
"""Migrate inventory.json items to individual markdown files in docs/resources/."""

import json
import re
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INVENTORY_JSON = ROOT / "docs" / "inventory-app" / "inventory.json"
RESOURCES_DIR = ROOT / "docs" / "resources"
DOCS_DIR = ROOT / "docs"

CATEGORY_MAP = {
    "Reagent": "reagent",
    "Buffer/Solution": "buffer",
    "Consumable": "consumable",
    "Equipment": "equipment",
}


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    # collapse repeated hyphens
    slug = re.sub(r"-+", "-", slug)
    return slug


def build_frontmatter(item: dict) -> str:
    obj_type = CATEGORY_MAP.get(item["category"], "reagent")
    lines = [
        "---",
        f"type: {obj_type}",
        f"title: \"{item['name']}\"",
    ]
    if item.get("location"):
        lines.append(f"location: \"{item['location']}\"")
    if item.get("quantity") is not None:
        lines.append(f"quantity: {item['quantity']}")
    if item.get("unit"):
        lines.append(f"unit: \"{item['unit']}\"")
    if item.get("lowStockThreshold") is not None:
        lines.append(f"low_stock_threshold: {item['lowStockThreshold']}")
    lines.append(f"legacy_inventory_id: {item['id']}")
    lines.append("---")
    return "\n".join(lines)


def build_body(item: dict) -> str:
    parts = [f"# {item['name']}", ""]
    if item.get("notes"):
        parts.append(item["notes"])
        parts.append("")
    return "\n".join(parts)


def migrate_items():
    RESOURCES_DIR.mkdir(parents=True, exist_ok=True)

    with open(INVENTORY_JSON) as f:
        items = json.load(f)

    id_to_slug = {}
    slug_counts = {}

    for item in items:
        slug = slugify(item["name"])
        # handle duplicates
        if slug in slug_counts:
            slug_counts[slug] += 1
            slug = f"{slug}-{slug_counts[slug]}"
        else:
            slug_counts[slug] = 1

        id_to_slug[item["id"]] = slug
        filepath = RESOURCES_DIR / f"{slug}.md"

        content = build_frontmatter(item) + "\n\n" + build_body(item)
        filepath.write_text(content)

    print(f"Created {len(items)} resource files in {RESOURCES_DIR}")

    # Save mapping for link migration
    map_path = ROOT / "scripts" / "inventory-id-map.json"
    with open(map_path, "w") as f:
        json.dump(id_to_slug, f, indent=2)
    print(f"Saved ID-to-slug mapping to {map_path}")

    return id_to_slug


def rewrite_inventory_links(id_to_slug: dict):
    """Find and rewrite inventory:// links to wikilinks in all markdown files."""
    pattern = re.compile(
        r'\[([^\]]*)\]\(inventory://(\d+)\)'
    )
    count = 0

    for md_file in DOCS_DIR.rglob("*.md"):
        text = md_file.read_text()
        if "inventory://" not in text:
            continue

        def replace_link(m):
            item_id = int(m.group(2))
            slug = id_to_slug.get(item_id)
            if slug:
                return f"[[{slug}]]"
            return m.group(0)  # leave unchanged if no mapping

        new_text = pattern.sub(replace_link, text)
        if new_text != text:
            md_file.write_text(new_text)
            count += 1
            print(f"  Rewrote links in {md_file.relative_to(ROOT)}")

    print(f"Updated {count} files with rewritten links")


if __name__ == "__main__":
    id_to_slug = migrate_items()
    rewrite_inventory_links(id_to_slug)
