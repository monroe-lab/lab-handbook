---
name: gel-render
description: Render synthetic gel electrophoresis figures (SVG) from a JSON spec — labeled lanes, DNA ladder with bp labels, bands, smears, annotations, caption. Use when a protocol or doc needs an "expected gel result" illustration, or when Grey mentions drawing/mocking up a gel, gel image, expected bands, or gel interpretation figure.
---

# Gel Render

Draws a clean synthetic agarose-gel figure so protocols can show what a correct
(or failed) gel looks like. Pure-stdlib Python → SVG. No dependencies.

## Quick start

```bash
/opt/homebrew/bin/python3.13 .claude/skills/gel-render/scripts/render_gel.py spec.json -o docs/images/gels/my-gel.svg
```

A working spec: [examples/genotyping.json](examples/genotyping.json)

## Spec format (JSON)

```json
{
  "title": "Expected result: genotyping PCR",
  "theme": "dark",
  "ladder": "1kb",
  "lanes": [
    {"label": "Ladder", "ladder": true},
    {"label": "WT", "bands": [{"size": 1200}]},
    {"label": "Homozygous", "bands": [{"size": 800, "label": "mutant allele (800 bp)"}]},
    {"label": "gDNA", "bands": [{"size": 9000, "intensity": 0.7}],
     "smear": {"from": 9000, "to": 400, "intensity": 0.25}},
    {"label": "NTC", "bands": []}
  ],
  "annotations": [{"lane": "WT", "size": 1200, "text": "WT allele (1.2 kb)"}],
  "caption": ["NTC must be blank."]
}
```

Field notes:

- **theme** — `"dark"` (UV-transilluminator look, default) or `"light"` (print-friendly).
- **ladder** — built-ins: `"1kb"`, `"100bp"`, `"lambda-hindiii"`; or give an explicit
  list of sizes (`[3000, 1500, 500]`), optionally `{"size": N, "intensity": 0.6}` per band.
  Built-ins are generic round-number illustration ladders — for a vendor-exact ladder
  (NEB/Thermo), look up the real band sizes and pass them explicitly; don't trust memory.
- **lanes** — each has `label`; a ladder lane sets `"ladder": true` (uses top-level
  ladder) or its own ladder value. Empty `bands: []` = blank lane (well still drawn).
- **bands** — `size` (bp, required), `intensity` 0–1 (default 1), `thickness` px
  (default 6), `label` (shorthand for an annotation on this band).
- **smear** — `from`/`to` in bp + `intensity` (≈0.2–0.4 reads well). For degraded
  gDNA, sheared DNA, RNA contamination, failed digests.
- **annotations** — leader-line callouts in the right margin; `lane` is a label or
  1-based index.
- **caption** — string or list of lines under the gel. Good place for interpretation
  ("if you see X, it means Y").
- **height** — gel slab px (default 400). Migration is log-scaled and auto-calibrated
  to the size range present.

## Workflow for protocol figures

1. Write the spec to `docs/images/gels/<slug>.json` (keep it — it's the editable source).
2. Render `docs/images/gels/<slug>.svg` next to it.
3. Embed from the protocol with a relative path, e.g. from `docs/wet-lab/x/page.md`:
   `![Expected gel](../../images/gels/<slug>.svg)`
4. Verify visually before committing: `qlmanage -t -s 1200 -o /tmp <file>.svg`
   then Read the resulting `/tmp/<file>.svg.png`.
5. Commit and push (site deploys from main).

Lanes should mirror the protocol's actual sample order, and sizes must come from the
protocol/primers, not guessed — if the expected size isn't stated anywhere, ask.
