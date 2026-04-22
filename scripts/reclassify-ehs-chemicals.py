#!/usr/bin/env python3
"""Reclassify EHS-registered resources from `type: reagent` → `type: chemical`.

Context: the initial migration of docs/resources/ defaulted everything to
`type: reagent`. But roughly 130 of those are pure chemicals that live in
the UC Davis EHS Chemical Inventory (docs/lab-safety/chemical-inventory.md).
This script cross-references the two and relabels matches.

What it does:
  1. Parses the Chemical Cabinet / Corrosive Cabinet / Flammable Cabinet /
     Refrigerator tables in chemical-inventory.md → (name, CAS, cabinet).
  2. Walks docs/resources/*.md. For each file with `type: reagent`:
       - tries filename-slug match against EHS slug set
       - falls back to title-slug match with an alias table
       - on match → flips type to `chemical`, adds `cas:` and `location:`
         frontmatter keys
  3. Leaves `buffer`, `kit`, `consumable`, `equipment`, `enzyme`, `solution`
     alone — only `reagent` gets reclassified.
  4. Reports unmatched EHS rows (candidates for new resource stubs, but
     stub creation is out of scope — Grey can review and decide).

Dry-run by default; pass `--apply` to write changes.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("pyyaml required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
INVENTORY = DOCS / "lab-safety" / "chemical-inventory.md"
RESOURCES = DOCS / "resources"

# EHS section headers → location field value (must match types.js options).
CABINET_TO_LOCATION = {
    "Chemical Cabinet": "Chemical Cabinet",
    "Corrosive Cabinet": "Corrosive Cabinet",
    "Flammable Cabinet": "Flammable Cabinet",
    "Refrigerator": "Refrigerator",
}

# Aliases: EHS name → resource slug (for cases where slugify doesn't match).
# Left side is the EHS row's "Chemical" column (lowercased); right side is
# the actual filename stem in docs/resources/.
ALIASES = {
    "glycerin": "glycerin",                                 # file is glycerin.md
    "glycerol, 50% aqueous solution": "glycerol-50-aqueous-solution",
    # Two files exist (ethanol-absolute.md + ethyl-alcohol-absolute.md).
    # The former is richer; point EHS to that one. The latter is a stale
    # auto-generated duplicate and should be deleted manually later.
    "ethyl alcohol absolute": "ethanol-absolute",
    "reagent alcohol 100% (200 proof, denatured)": "reagent-alcohol-100-200-proof-denatured",
    "isopropyl alcohol, 70% in water": "isopropyl-alcohol-70-in-water",
    "cetrimonium bromide": "cetrimonium-bromide",
    "hexadecyltrimethyl-ammonium bromide": "hexadecyltrimethyl-ammonium-bromide",
    "d-(+)-glucose": "d-glucose",
    "alpha-d-glucose": "alpha-d-glucose",
    "sodium hydroxide 10n aqueous solution": "sodium-hydroxide-10n-aqueous-solution",
    "sodium hydroxide, 10.0 normal": "sodium-hydroxide-10-0-normal",
    "disodium ethylenediamine tetraacetate": "disodium-ethylenediamine-tetraacetate",
    "ethylenediaminetetraacetic acid, gmp": "ethylenediaminetetraacetic-acid-gmp",
    "ethylene glycol-bis(beta-aminoethyl ether)-n,n,n',n'-tetraacetic acid tetrasodium salt": "ethylene-glycol-bis-beta-aminoethyl-ether-n-n-n-n-tetraacetic-acid-tetrasodium-salt",
    "tris-edta (te) buffer solution": "tris-edta-te-buffer-solution",
    "tris base": "tris-base",
    "trizma base": "tris-base",      # same CAS as Tris base
    "tham": "tris-base",              # same CAS as Tris base
    "hydrogen peroxide,  20 to  35 % in water": "hydrogen-peroxide-20-to-35-in-water",
    "aceto-orcein solution, 2%": "aceto-orcein-solution-2",
    "agar, plant, tc": "agar-plant-tc",
    "agar": "agar-non-tc",
    "peptones, casein (tryptone)": "peptones-casein-tryptone",
    "bis (n,n'-methylene-bis-acrylamide)": "bis-n-n-methylene-bis-acrylamide",
    "imidazole hydrochloride": "imidazole-hydrochloride",
    "piperazine-1,4-bis(2-ethanesulfonic acid)": "piperazine-1-4-bis-2-ethanesulfonic-acid",
    "pipes, dipotassium salt": "pipes-dipotassium-salt",
    "cis-diamineplatinum(ii) dichloride": "cis-diamineplatinum-ii-dichloride",
    "phenol - chloroform - isoamyl alcohol mixture  25:24:1": "phenol-chloroform-isoamyl-alcohol-25-24-1",
    "chloroform:isoamyl alcohol 24:1": "chloroform-isoamyl-alcohol-24-1",
    "manganese(ii) chloride": "manganese-ii-chloride",
    "iron(iii) chloride": "iron-iii-chloride",
    "activated charcoal": "activated-charcoal",
    "carbon, activated": "carbon-activated",
    "1-hydroxy-3-(3-trifluoromethylphenyl)urea": "1-hydroxy-3-3-trifluoromethylphenyl-urea",
    "1m tris-hcl (ph 8-8.5)": "1m-tris-hcl-ph-8-8-5",
    "1,8-naphthalic anhydride": "1-8-naphthalic-anhydride",
    "phenylmethanesulfonyl fluoride": "phenylmethanesulfonyl-fluoride",
    "guanidine thiocyanate": "guanidine-thiocyanate",
    "polyethylene glycol (solid)": "polyethylene-glycol-solid",
    "formaldehyde (16% methanol free) pfa": "formaldehyde-16-methanol-free-pfa",
    "phenol nitroprusside solution": "phenol-nitroprusside-solution",
    "dkw medium with vitamins": "dkw-medium-with-vitamins",
    "gaseous hydrochloric acid": "gaseous-hydrochloric-acid",
    "mitomycin c": "mitomycin-c",
    "tween 80": "tween-80",
    "taps": "taps",
    "tapso": "tapso",
    "hepes": "hepes",
    "edta tetrasodium salt dihydrate": "edta-tetrasodium-salt-dihydrate",
    "edta trisodium salt": "edta-trisodium-salt",
    "egta": "egta",
}


def slugify(s: str) -> str:
    """Same slugify as the rest of the app: lowercase, non-alnum → '-', collapse, trim."""
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def parse_inventory(md: str) -> list[dict]:
    """Parse the EHS cabinet tables. Returns list of {name, cas_list, cabinet}."""
    entries: list[dict] = []
    current_cabinet: str | None = None
    header_re = re.compile(r"^##\s+(Chemical Cabinet|Corrosive Cabinet|Flammable Cabinet|Refrigerator)\b")
    row_re = re.compile(r"^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$")
    for line in md.splitlines():
        h = header_re.match(line)
        if h:
            current_cabinet = h.group(1)
            continue
        if not current_cabinet:
            continue
        # Skip header/separator rows
        if line.strip().startswith("| Chemical ") or set(line.strip()) <= set("|- "):
            continue
        m = row_re.match(line)
        if not m:
            continue
        name = m.group(1).strip()
        cas_raw = m.group(2).strip()
        if not name or name.lower() == "chemical":
            continue
        cas_list = [c.strip() for c in cas_raw.split(",") if c.strip()]
        entries.append({"name": name, "cas_list": cas_list, "cabinet": current_cabinet})
    return entries


def load_frontmatter(path: Path) -> tuple[dict, str]:
    """Split a markdown file into (frontmatter dict, rest of body)."""
    text = path.read_text()
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_text = text[4:end]
    body = text[end + 5:]
    try:
        fm = yaml.safe_load(fm_text) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, body


def write_frontmatter(path: Path, fm: dict, body: str) -> None:
    # Preserve key order: title first if present, then type, then cas, then everything else
    priority = ["title", "type", "cas", "location", "status"]
    ordered = {}
    for k in priority:
        if k in fm:
            ordered[k] = fm[k]
    for k in fm:
        if k not in ordered:
            ordered[k] = fm[k]
    dumped = yaml.safe_dump(ordered, sort_keys=False, allow_unicode=True, width=1000).rstrip()
    path.write_text(f"---\n{dumped}\n---\n{body.lstrip(chr(10))}")


def build_ehs_index(entries: list[dict]) -> dict[str, dict]:
    """Map slug → {cas_list, cabinet, names}. First cabinet wins for duplicates."""
    idx: dict[str, dict] = {}
    for e in entries:
        name = e["name"]
        key = ALIASES.get(name.lower(), slugify(name))
        if key not in idx:
            idx[key] = {"cas_list": list(e["cas_list"]), "cabinet": e["cabinet"], "names": [name]}
        else:
            idx[key]["names"].append(name)
            for cas in e["cas_list"]:
                if cas and cas not in idx[key]["cas_list"]:
                    idx[key]["cas_list"].append(cas)
    return idx


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write changes (default: dry-run).")
    parser.add_argument("--verbose", action="store_true", help="Show every matched + unmatched row.")
    args = parser.parse_args()

    if not INVENTORY.exists():
        print(f"Missing {INVENTORY}", file=sys.stderr)
        return 1

    entries = parse_inventory(INVENTORY.read_text())
    ehs_idx = build_ehs_index(entries)

    print(f"EHS inventory: {len(entries)} container rows, {len(ehs_idx)} unique chemical slugs")

    # Walk resources/
    updated: list[tuple[Path, dict]] = []
    already_chemical: list[Path] = []
    skipped_non_reagent: list[tuple[Path, str]] = []
    unmatched_reagents: list[Path] = []

    resource_slugs = set()
    for path in sorted(RESOURCES.glob("*.md")):
        resource_slugs.add(path.stem)
        fm, body = load_frontmatter(path)
        t = fm.get("type", "")
        if t == "chemical":
            already_chemical.append(path)
            continue
        if t != "reagent":
            skipped_non_reagent.append((path, t))
            continue
        # Match by filename slug
        hit = ehs_idx.get(path.stem)
        if not hit:
            # Fallback: try slugified title
            title_slug = slugify(str(fm.get("title", "")))
            hit = ehs_idx.get(title_slug)
        if not hit:
            unmatched_reagents.append(path)
            continue

        new_fm = dict(fm)
        new_fm["type"] = "chemical"
        if hit["cas_list"]:
            # Multiple CAS → comma-joined string
            new_fm["cas"] = ", ".join(hit["cas_list"]) if len(hit["cas_list"]) > 1 else hit["cas_list"][0]
        cabinet_loc = CABINET_TO_LOCATION.get(hit["cabinet"])
        if cabinet_loc and not new_fm.get("location"):
            new_fm["location"] = cabinet_loc
        updated.append((path, new_fm))

    # EHS entries without a matching resource file
    missing_stubs: list[tuple[str, dict]] = []
    for slug, info in sorted(ehs_idx.items()):
        if slug not in resource_slugs:
            missing_stubs.append((slug, info))

    print()
    print(f"Will reclassify reagent → chemical: {len(updated)} files")
    print(f"Already chemical: {len(already_chemical)} files")
    print(f"Skipped (non-reagent type): {len(skipped_non_reagent)} files")
    print(f"Unmatched reagents (stay as reagent): {len(unmatched_reagents)} files")
    print(f"EHS entries without a resource file: {len(missing_stubs)}")

    if args.verbose or not args.apply:
        print("\n--- RECLASSIFY (reagent → chemical) ---")
        for path, new_fm in updated:
            cas = new_fm.get("cas", "")
            loc = new_fm.get("location", "")
            print(f"  {path.stem:50s}  cas={cas:20s}  loc={loc}")

        print("\n--- UNMATCHED REAGENTS (stay as reagent) ---")
        for path in unmatched_reagents:
            print(f"  {path.stem}")

        print("\n--- EHS ENTRIES WITH NO RESOURCE FILE ---")
        for slug, info in missing_stubs:
            cas = ", ".join(info["cas_list"]) if info["cas_list"] else "(no CAS)"
            print(f"  {slug:50s}  cas={cas:25s}  names={info['names']}")

    if not args.apply:
        print("\n(dry-run — pass --apply to write changes)")
        return 0

    for path, new_fm in updated:
        _, body = load_frontmatter(path)
        write_frontmatter(path, new_fm, body)
    print(f"\nWrote {len(updated)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
