#!/usr/bin/env python3
"""R19: migrate samples.json + docs/samples/ to first-class `accession` objects.

What this does:
  1. Read docs/sample-tracker/samples.json (the legacy tracker table) and emit
     one `docs/accessions/<slug>.md` per row, with `type: accession` frontmatter
     carrying the tracker fields (accession_id, species, project, lead,
     sequencing_type, status, priority, current_blocker, detail_sheet_link,
     last_updated). The `notes` field becomes the markdown body.

  2. Migrate the handful of hand-written concept files in docs/samples/ that
     represent real accessions (`sample-pistachio-4.md`, `maize-leaf-1.md`)
     to `docs/accessions/<slug>.md` with `type: accession`. Delete the two
     test fixtures (`new-tube-mo8yb345.md`, `test-sample.md`).

  3. Rewrite every `[[samples/<slug>]]` wikilink and `of:` frontmatter ref
     across the vault to `[[accessions/<slug>]]`. The three pistachio tubes
     in docs/locations/ are the primary consumers.

  4. Archive docs/sample-tracker/samples.json to
     docs/sample-tracker/samples.json.r19-archive.json so the data is still
     recoverable, but the live tracker page no longer reads it.

Run with `--apply` to actually write. Default is dry-run with a diff-style
summary so you can eyeball the plan before pulling the trigger.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
SAMPLES_JSON = DOCS / "sample-tracker" / "samples.json"
ACCESSIONS_DIR = DOCS / "accessions"
OLD_SAMPLES_DIR = DOCS / "samples"

# docs/samples/*.md files that need explicit handling. Everything in here
# gets migrated to docs/accessions/ (or deleted, for tests).
EXISTING_SAMPLES = {
    "sample-pistachio-4.md": {"action": "migrate", "new_slug": "pistachio-4"},
    "maize-leaf-1.md":       {"action": "migrate", "new_slug": "maize-leaf-1"},
    "new-tube-mo8yb345.md":  {"action": "delete"},   # test junk ("hgjhghjgjh")
    "test-sample.md":        {"action": "delete"},   # explicitly a test fixture
}


def slugify(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "unnamed"


def yaml_escape(v: str) -> str:
    """Quote a string for YAML frontmatter. Use double quotes, escape backslash and quote."""
    if v is None:
        return ""
    s = str(v)
    # If safe (alphanumeric + basic punct, no colons/braces/hash), leave bare.
    # Otherwise double-quote with escaping.
    if s == "" or any(c in s for c in ':#{}[]|>&*!%@,\n"\\\''):
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return s


def build_accession_frontmatter(row: dict) -> str:
    """Build YAML frontmatter for an accession from a samples.json row."""
    fields: list[tuple[str, str]] = [
        ("type", "accession"),
        ("title", row.get("sampleId", "Untitled")),
        ("accession_id", row.get("sampleId", "")),
    ]
    if row.get("species"):          fields.append(("species", row["species"]))
    if row.get("project"):          fields.append(("project", row["project"]))
    if row.get("lead"):             fields.append(("lead", row["lead"]))
    if row.get("sequencingType"):   fields.append(("sequencing_type", row["sequencingType"]))
    if row.get("status"):           fields.append(("status", row["status"]))
    if row.get("priority"):         fields.append(("priority", row["priority"]))
    if row.get("currentBlocker"):   fields.append(("current_blocker", row["currentBlocker"]))
    if row.get("detailSheetLink"): fields.append(("detail_sheet_link", row["detailSheetLink"]))
    if row.get("lastUpdated"):      fields.append(("last_updated", row["lastUpdated"]))
    # Preserve the legacy id so we can cross-reference if anything downstream
    # still held onto it (project notes, spreadsheets, etc.).
    if row.get("id") is not None:
        fields.append(("legacy_sample_tracker_id", str(row["id"])))

    lines = ["---"]
    for k, v in fields:
        lines.append(f"{k}: {yaml_escape(v)}")
    lines.append("---")
    return "\n".join(lines)


def build_accession_body(row: dict) -> str:
    body = f"\n# {row.get('sampleId','Untitled')}\n"
    notes = (row.get("notes") or "").strip()
    if notes:
        body += f"\n{notes}\n"
    return body


def write_if_changed(path: Path, content: str, plan: list, apply: bool) -> None:
    existing = path.read_text(encoding="utf-8") if path.exists() else None
    if existing == content:
        return
    plan.append(("write", path.relative_to(REPO), len(content)))
    if apply:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def migrate_samples_json(plan: list, apply: bool, used_slugs: set[str]) -> dict[str, str]:
    """Returns a slug-remap mapping from old `samples/<legacy-slug>` to new
    `accessions/<new-slug>` so the wikilink-rewriter can apply it later."""
    with SAMPLES_JSON.open(encoding="utf-8") as f:
        data = json.load(f)

    remap: dict[str, str] = {}
    for row in data:
        sid = row.get("sampleId") or ""
        if not sid:
            print(f"  WARN: row id={row.get('id')} has no sampleId — skipping", file=sys.stderr)
            continue
        slug = slugify(sid)
        # Dedupe: should not happen (we verified 228/228 unique) but be safe.
        orig_slug = slug
        n = 2
        while slug in used_slugs:
            slug = f"{orig_slug}-{n}"
            n += 1
        used_slugs.add(slug)

        path = ACCESSIONS_DIR / f"{slug}.md"
        content = build_accession_frontmatter(row) + build_accession_body(row)
        write_if_changed(path, content, plan, apply)

        # Legacy sample-tracker never had a `samples/<slug>` wikilink form
        # (it was JSON, not markdown), but note the mapping for completeness.
        remap[f"samples/{slug}"] = f"accessions/{slug}"

    return remap


def migrate_existing_samples_dir(plan: list, apply: bool, used_slugs: set[str]) -> dict[str, str]:
    """Migrate or delete the hand-written files under docs/samples/. Returns
    a slug remap for wikilink rewriting (every migrated file needs its
    `samples/<old-slug>` → `accessions/<new-slug>` recorded)."""
    remap: dict[str, str] = {}
    if not OLD_SAMPLES_DIR.exists():
        return remap
    for md in sorted(OLD_SAMPLES_DIR.glob("*.md")):
        rule = EXISTING_SAMPLES.get(md.name)
        if rule is None:
            print(f"  WARN: unclassified file {md.name} — leaving in place", file=sys.stderr)
            continue
        if rule["action"] == "delete":
            plan.append(("delete", md.relative_to(REPO), 0))
            if apply:
                md.unlink()
            # Record the remap so any stale wikilink to this slug points
            # nowhere meaningful (the link-rewriter will still update it
            # for consistency but the target will 404 — intentional).
            old_slug = md.stem
            remap[f"samples/{old_slug}"] = f"accessions/{old_slug}"
            continue
        if rule["action"] == "migrate":
            new_slug = rule["new_slug"]
            if new_slug in used_slugs:
                # Collide with a sampleId-derived slug? Append "-card".
                new_slug = f"{new_slug}-card"
            used_slugs.add(new_slug)
            content = md.read_text(encoding="utf-8")
            # Swap `type: sample` → `type: accession` and drop the no-longer-
            # meaningful instance-level fields. Preserve the body verbatim.
            content = re.sub(r'^type:\s*["\']?sample["\']?\s*$', 'type: accession',
                             content, count=1, flags=re.MULTILINE)
            # sample_id → accession_id (preserve if present).
            content = re.sub(r'^sample_id:', 'accession_id:', content, count=1, flags=re.MULTILINE)
            new_path = ACCESSIONS_DIR / f"{new_slug}.md"
            write_if_changed(new_path, content, plan, apply)
            plan.append(("delete", md.relative_to(REPO), 0))
            if apply:
                md.unlink()
            old_slug = md.stem
            remap[f"samples/{old_slug}"] = f"accessions/{new_slug}"
    # Remove the now-empty docs/samples/ directory so the object-index doesn't
    # keep walking it. If anyone re-adds a sample file, the new `sample` type
    # has group='accessions' and will write under docs/accessions/ by default.
    if apply:
        try:
            OLD_SAMPLES_DIR.rmdir()
            plan.append(("rmdir", OLD_SAMPLES_DIR.relative_to(REPO), 0))
        except OSError:
            pass  # Not empty, leave alone
    return remap


def rewrite_wikilinks(remap: dict[str, str], plan: list, apply: bool) -> None:
    """Rewrite every `[[samples/X]]` / `[[samples/X.md]]` / `[[samples/X|Alt]]`
    and any `of: samples/X` (or quoted variants) across docs/ to point at
    the new `accessions/` slug. Skips the legacy samples.json archive.

    We use a broad pattern because hand-authored wikilinks may or may not
    include `.md`, may have display text after `|`, and `of:` fields may
    be quoted or unquoted. Each replacement preserves the surrounding
    syntax verbatim.
    """
    # Broad pattern: samples/<slug> inside [[...]] or after `of:`.
    # Group 1: the old slug (captured so we can remap via the dict above).
    # We match `samples/` followed by [a-z0-9-]+ (optional `.md` or `|alt` or `]`)
    wl_re = re.compile(r'samples/([a-z0-9][a-z0-9\-_]*)', re.IGNORECASE)

    changed_files = 0
    changed_refs = 0
    for md in DOCS.rglob("*.md"):
        # Skip archives / generated
        if any(part.startswith("_archive") or part.startswith(".") for part in md.relative_to(DOCS).parts):
            continue
        text = md.read_text(encoding="utf-8")

        def _sub(m):
            nonlocal changed_refs
            old_slug = m.group(1).lower()
            new_ref = remap.get(f"samples/{old_slug}")
            if not new_ref:
                # Not a known slug — still rewrite samples/X → accessions/X
                # so consumers don't linger on a dead namespace. The tubes
                # referencing docs/samples/sample-pistachio-4 hit this if
                # the explicit remap missed a case, which is why we fall
                # back to a blanket namespace swap.
                new_ref = f"accessions/{old_slug.replace('sample-', '', 1) if old_slug.startswith('sample-') else old_slug}"
            changed_refs += 1
            return new_ref

        new_text = wl_re.sub(_sub, text)
        if new_text != text:
            plan.append(("rewrite", md.relative_to(REPO), text.count("samples/") - new_text.count("samples/")))
            changed_files += 1
            if apply:
                md.write_text(new_text, encoding="utf-8")

    print(f"  wikilink rewrite: {changed_refs} refs across {changed_files} files")


def archive_samples_json(plan: list, apply: bool) -> None:
    if not SAMPLES_JSON.exists():
        return
    archive = SAMPLES_JSON.with_name("samples.json.r19-archive.json")
    plan.append(("archive", archive.relative_to(REPO), SAMPLES_JSON.stat().st_size))
    if apply:
        SAMPLES_JSON.rename(archive)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes (default: dry-run)")
    args = ap.parse_args()

    plan: list = []
    used_slugs: set[str] = set()

    print("R19 migration plan:")
    remap = migrate_samples_json(plan, args.apply, used_slugs)
    remap.update(migrate_existing_samples_dir(plan, args.apply, used_slugs))
    rewrite_wikilinks(remap, plan, args.apply)
    archive_samples_json(plan, args.apply)

    writes = sum(1 for op, *_ in plan if op == "write")
    deletes = sum(1 for op, *_ in plan if op == "delete")
    rewrites = sum(1 for op, *_ in plan if op == "rewrite")
    print(f"\nSummary: {writes} writes · {deletes} deletes · {rewrites} file rewrites")
    if not args.apply:
        print("(dry-run — re-run with --apply to write changes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
