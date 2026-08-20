#!/usr/bin/env python3
"""Render a synthetic agarose-gel figure (SVG) from a JSON spec.

Pure stdlib — no matplotlib, no pillow. Works on any python3.

Usage:
  python3 render_gel.py spec.json [-o out.svg]

Spec format: see SKILL.md next to this script.
"""
import argparse
import json
import math
import sys
from pathlib import Path

# Generic illustration ladders (round-number sizes). For a vendor-exact ladder,
# pass an explicit list of sizes in the spec instead.
LADDERS = {
    "1kb": [10000, 8000, 6000, 5000, 4000, 3000, 2500, 2000, 1500, 1000, 750, 500, 250],
    "100bp": [1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
    "lambda-hindiii": [23130, 9416, 6557, 4361, 2322, 2027, 564],
}

THEMES = {
    "dark": dict(bg="#101318", gel="#1a1f26", gel_edge="#252b34", well="#0a0c10",
                 band="#f2f5f9", text="#e8ebef", subtext="#9aa3ad", accent="#7fd1ff"),
    "light": dict(bg="#ffffff", gel="#eef0f3", gel_edge="#d8dbe0", well="#c9cdd4",
                  band="#20262e", text="#20262e", subtext="#5a6470", accent="#0b6bcb"),
}

FONT = "Helvetica Neue, Helvetica, Arial, sans-serif"


def fmt_bp(n):
    if n >= 1000:
        s = f"{n / 1000:.1f}".rstrip("0").rstrip(".")
        return f"{s} kb"
    return f"{int(n)} bp"


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def lane_ladder_sizes(lane, spec):
    """Return [(size, intensity), ...] if this lane is a ladder lane, else None."""
    lad = lane.get("ladder")
    if not lad:
        return None
    if lad is True:
        lad = spec.get("ladder", "1kb")
    if isinstance(lad, str):
        if lad not in LADDERS:
            sys.exit(f"Unknown ladder '{lad}'. Built-ins: {', '.join(LADDERS)}. "
                     "Or pass an explicit list of sizes.")
        lad = LADDERS[lad]
    out = []
    for item in lad:
        if isinstance(item, dict):
            out.append((float(item["size"]), float(item.get("intensity", 1.0))))
        else:
            out.append((float(item), 1.0))
    return out


def render(spec):
    theme = THEMES[spec.get("theme", "dark")]
    lanes = spec.get("lanes") or sys.exit("Spec needs a non-empty 'lanes' list.")
    title = spec.get("title", "")
    caption = spec.get("caption", "")
    if isinstance(caption, str):
        caption = [caption] if caption else []

    # ---- collect every size that must fit on the gel ----
    sizes = []
    for lane in lanes:
        lad = lane_ladder_sizes(lane, spec)
        if lad:
            sizes += [s for s, _ in lad]
        for b in lane.get("bands", []):
            sizes.append(float(b["size"]))
        sm = lane.get("smear")
        if sm:
            sizes += [float(sm["from"]), float(sm["to"])]
    if not sizes:
        sys.exit("No bands, ladders, or smears anywhere — nothing to draw.")
    lo, hi = min(sizes) * 0.80, max(sizes) * 1.25

    # ---- geometry ----
    lane_w, lane_gap = 46, 12
    pitch = lane_w + lane_gap
    has_ladder_labels = any(lane_ladder_sizes(l, spec) for l in lanes)
    annots = list(spec.get("annotations", []))
    # band-level "label" is shorthand for an annotation
    for i, lane in enumerate(lanes):
        for b in lane.get("bands", []):
            if b.get("label"):
                annots.append({"lane": i + 1, "size": b["size"], "text": b["label"]})

    m_left = 84 if has_ladder_labels else 26
    m_right = 200 if annots else 26
    title_h = 34 if title else 12
    # headroom for rotated labels scales with the longest label
    max_label = max((len(str(l.get("label", ""))) for l in lanes), default=0)
    label_h = max(46, min(130, 20 + int(max_label * 6.4 * 0.643)))
    gel_h = int(spec.get("height", 400))
    well_h = 9
    cap_h = 22 * len(caption) + (10 if caption else 0)

    gel_x = m_left
    gel_w = lane_gap + len(lanes) * pitch
    gel_y = title_h + label_h
    width = m_left + gel_w + m_right
    height = gel_y + gel_h + cap_h + 16

    wells_y = gel_y + 14
    run_top = wells_y + well_h + 16
    run_bot = gel_y + gel_h - 20

    def y_of(size):
        frac = (math.log10(hi) - math.log10(size)) / (math.log10(hi) - math.log10(lo))
        return run_top + frac * (run_bot - run_top)

    def lane_cx(i):
        return gel_x + lane_gap + i * pitch + lane_w / 2

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
               f'viewBox="0 0 {width} {height}" font-family="{FONT}">')
    svg.append(
        '<defs>'
        '<filter id="b1" x="-50%" y="-50%" width="200%" height="200%">'
        '<feGaussianBlur stdDeviation="0.7"/></filter>'
        '<filter id="b2" x="-80%" y="-80%" width="260%" height="260%">'
        '<feGaussianBlur stdDeviation="2.6"/></filter>'
        '<filter id="b3" x="-80%" y="-80%" width="260%" height="260%">'
        '<feGaussianBlur stdDeviation="1.6"/></filter>'
        '</defs>')
    svg.append(f'<rect width="{width}" height="{height}" fill="{theme["bg"]}"/>')

    if title:
        svg.append(f'<text x="{width / 2}" y="22" text-anchor="middle" font-size="15" '
                   f'font-weight="600" fill="{theme["text"]}">{esc(title)}</text>')

    # gel slab
    svg.append(f'<rect x="{gel_x}" y="{gel_y}" width="{gel_w}" height="{gel_h}" rx="6" '
               f'fill="{theme["gel"]}" stroke="{theme["gel_edge"]}" stroke-width="1"/>')

    # ---- lanes ----
    smear_id = 0
    for i, lane in enumerate(lanes):
        cx = lane_cx(i)
        bx = cx - lane_w * 0.38
        bw = lane_w * 0.76

        # well
        svg.append(f'<rect x="{cx - lane_w * 0.42}" y="{wells_y}" width="{lane_w * 0.84}" '
                   f'height="{well_h}" rx="2" fill="{theme["well"]}"/>')

        # rotated lane label above the well
        label = lane.get("label", "")
        if label:
            lx, ly = cx - 2, gel_y - 8
            svg.append(f'<text x="{lx}" y="{ly}" font-size="12" fill="{theme["text"]}" '
                       f'transform="rotate(-40 {lx} {ly})">{esc(label)}</text>')

        # smear
        sm = lane.get("smear")
        if sm:
            smear_id += 1
            y1, y2 = sorted([y_of(float(sm["from"])), y_of(float(sm["to"]))])
            op = float(sm.get("intensity", 0.3))
            svg.append(
                f'<defs><linearGradient id="sm{smear_id}" x1="0" y1="0" x2="0" y2="1">'
                f'<stop offset="0%" stop-color="{theme["band"]}" stop-opacity="0"/>'
                f'<stop offset="18%" stop-color="{theme["band"]}" stop-opacity="{op}"/>'
                f'<stop offset="82%" stop-color="{theme["band"]}" stop-opacity="{op}"/>'
                f'<stop offset="100%" stop-color="{theme["band"]}" stop-opacity="0"/>'
                f'</linearGradient></defs>')
            svg.append(f'<rect x="{bx}" y="{y1:.1f}" width="{bw}" height="{y2 - y1:.1f}" '
                       f'fill="url(#sm{smear_id})" filter="url(#b3)"/>')

        # bands (explicit + ladder)
        band_list = [(float(b["size"]), float(b.get("intensity", 1.0)),
                      float(b.get("thickness", 6))) for b in lane.get("bands", [])]
        lad = lane_ladder_sizes(lane, spec)
        if lad:
            band_list += [(s, inten, 5) for s, inten in lad]
        for size, inten, th in band_list:
            y = y_of(size)
            # glow layer then crisp band
            svg.append(f'<rect x="{bx - 2}" y="{y - th / 2 - 1.5:.1f}" width="{bw + 4}" '
                       f'height="{th + 3}" rx="{th / 2 + 1.5}" fill="{theme["band"]}" '
                       f'opacity="{0.45 * inten:.2f}" filter="url(#b2)"/>')
            svg.append(f'<rect x="{bx}" y="{y - th / 2:.1f}" width="{bw}" height="{th}" '
                       f'rx="{th / 2}" fill="{theme["band"]}" opacity="{min(1.0, inten):.2f}" '
                       f'filter="url(#b1)"/>')

    # ---- ladder size labels (left margin, from the first ladder lane) ----
    if has_ladder_labels:
        first = next(lane_ladder_sizes(l, spec) for l in lanes
                     if lane_ladder_sizes(l, spec))
        last_y = -1e9
        for size, _ in sorted(first, key=lambda t: -t[0]):
            y = y_of(size)
            if y - last_y < 13:      # skip labels that would collide
                continue
            last_y = y
            svg.append(f'<text x="{gel_x - 10}" y="{y + 3.5:.1f}" text-anchor="end" '
                       f'font-size="10.5" fill="{theme["subtext"]}">{fmt_bp(size)}</text>')
            svg.append(f'<line x1="{gel_x - 6}" y1="{y:.1f}" x2="{gel_x - 1}" y2="{y:.1f}" '
                       f'stroke="{theme["subtext"]}" stroke-width="1"/>')

    # ---- annotations (right margin with leader lines) ----
    def lane_index(ref):
        if isinstance(ref, int):
            return ref - 1
        for i, lane in enumerate(lanes):
            if lane.get("label") == ref:
                return i
        sys.exit(f"Annotation refers to unknown lane {ref!r}")

    placed = []
    for a in sorted(annots, key=lambda a: y_of(float(a["size"]))):
        i = lane_index(a["lane"])
        y = y_of(float(a["size"]))
        ty = y
        if placed and ty - placed[-1] < 16:
            ty = placed[-1] + 16
        placed.append(ty)
        x0 = lane_cx(i) + lane_w * 0.42
        tx = gel_x + gel_w + 14
        svg.append(f'<path d="M {x0:.1f} {y:.1f} L {tx - 6:.1f} {ty:.1f}" fill="none" '
                   f'stroke="{theme["accent"]}" stroke-width="1" opacity="0.55" '
                   f'stroke-dasharray="3 3"/>')
        svg.append(f'<circle cx="{x0:.1f}" cy="{y:.1f}" r="1.8" fill="{theme["accent"]}"/>')
        svg.append(f'<text x="{tx}" y="{ty + 3.5:.1f}" font-size="11.5" '
                   f'fill="{theme["accent"]}">{esc(a["text"])}</text>')

    # ---- caption ----
    cy = gel_y + gel_h + 24
    for line in caption:
        svg.append(f'<text x="{gel_x}" y="{cy}" font-size="11.5" '
                   f'fill="{theme["subtext"]}">{esc(line)}</text>')
        cy += 18

    svg.append('</svg>')
    return "\n".join(svg)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("spec", help="JSON spec file")
    p.add_argument("-o", "--out", help="output .svg (default: spec name with .svg)")
    args = p.parse_args()
    spec = json.loads(Path(args.spec).read_text())
    out = Path(args.out) if args.out else Path(args.spec).with_suffix(".svg")
    out.write_text(render(spec))
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
