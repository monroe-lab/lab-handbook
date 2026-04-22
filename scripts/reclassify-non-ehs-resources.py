#!/usr/bin/env python3
"""Second-pass reclassification of docs/resources/*.md.

After reclassify-ehs-chemicals.py flipped every EHS-matched file to
`type: chemical`, the remaining 38 `type: reagent` files break into three
real categories:

  1. Pure chemicals we physically have but that aren't yet registered in
     the UC Davis EHS system (sucrose, DTT, tween-20, DMF-anhydrous, IPTG,
     PVPP, MS basal salt, 30% H2O2). Grey's call: still `type: chemical`;
     Kehan gets a bulletin note to register them.

  2. Enzymes (benzonase, DNase, polymerases, tagmentase, proteinase K) —
     were lumped under `reagent` because the early migration defaulted
     to that. Flip to `type: enzyme`.

  3. Commercial kits / ready-mixes / ladders / stains / protein standards
     / magnetic beads / pre-made buffers — flip to `type: kit`.

Things left as `reagent`: oligos, nuclease-free water, pH calibration
buffers, prepared dilutions (ethanol-70), ethyl-alcohol-absolute (stale
duplicate of ethanol-absolute).

Dry-run by default; pass --apply to write.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("pyyaml required", file=sys.stderr)
    sys.exit(1)

REPO = Path(__file__).resolve().parent.parent
RESOURCES = REPO / "docs" / "resources"

# Explicit mapping: slug → new type.
PROMOTE_CHEMICAL = [
    "dithiothreitol-dtt",
    "dimethylformamide-anhydrous",
    "sucrose",
    "tween-20",
    "iptg",
    "polyvinylpolypyrrolidone-pvpp",
    "ms-basal-salt-mixture",
    "hydrogen-peroxide-30",
]

PROMOTE_ENZYME = [
    "benzonase-nuclease",
    "diagenode-tagmentase-loaded",
    "dnase",
    "illumina-tagment-dna-enzyme-tde1",
    "neb-q5-hotstart-polymerase",
    "rnase",
    "sigma-proteinase-k",
    "thermo-dnase-i-rnase-free",
    "tn5-unloaded-blank",
]

PROMOTE_KIT = [
    "ampure-xp-beads",
    "bio-rad-laemmli-sample-buffer-2x",
    "bio-rad-precision-plus-protein-standards",
    "bio-rad-sds-page-running-buffer",
    "bovine-serum-albumin-50mg-ml",
    "bradford-reagent",
    "cytiva-sera-mag-speedbead-carboxyl",
    "dna-ladder-1kb-plus",
    "lambda-dna-standard",
    "roche-kapa-hifi-hotstart-readymix",
    "roche-protease-inhibitor-cocktail-edta-free",
    "sybr-gold",
]

PLAN = (
    [(s, "chemical") for s in PROMOTE_CHEMICAL]
    + [(s, "enzyme") for s in PROMOTE_ENZYME]
    + [(s, "kit") for s in PROMOTE_KIT]
)


def load_frontmatter(path: Path) -> tuple[dict, str]:
    text = path.read_text()
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm = yaml.safe_load(text[4:end]) or {}
    body = text[end + 5:]
    return fm, body


def write_frontmatter(path: Path, fm: dict, body: str) -> None:
    priority = ["title", "type", "cas", "location", "status"]
    ordered = {k: fm[k] for k in priority if k in fm}
    for k in fm:
        if k not in ordered:
            ordered[k] = fm[k]
    dumped = yaml.safe_dump(ordered, sort_keys=False, allow_unicode=True, width=1000).rstrip()
    path.write_text(f"---\n{dumped}\n---\n{body.lstrip(chr(10))}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    changed: list[tuple[str, str, str]] = []
    missing: list[str] = []
    skipped: list[tuple[str, str]] = []

    for slug, new_type in PLAN:
        path = RESOURCES / f"{slug}.md"
        if not path.exists():
            missing.append(slug)
            continue
        fm, body = load_frontmatter(path)
        current = fm.get("type", "")
        if current == new_type:
            skipped.append((slug, current))
            continue
        fm["type"] = new_type
        changed.append((slug, current, new_type))
        if args.apply:
            write_frontmatter(path, fm, body)

    print(f"Will change: {len(changed)} files")
    for slug, old, new in changed:
        print(f"  {slug:50s}  {old:10s} → {new}")
    if skipped:
        print(f"\nAlready correct: {len(skipped)}")
        for slug, t in skipped:
            print(f"  {slug:50s}  already {t}")
    if missing:
        print(f"\nMissing files: {len(missing)}")
        for slug in missing:
            print(f"  {slug}")

    if not args.apply:
        print("\n(dry-run — pass --apply to write)")
    else:
        print(f"\nWrote {len(changed)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
