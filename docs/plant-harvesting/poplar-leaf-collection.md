---
---

# Collecting Poplar Leaves for Somatic Mutation Sequencing

For each tree: fill a **50 mL Falcon tube** (or equivalent) **loose** with the **youngest leaves from a single branch tip**, flash-freeze, label clearly, ship on dry ice to UC Davis.

**Oregon (Westport) and Maryland (UMES) sites:** 21 trees per site — 1 tree per line (the 18 transgenic events + WT717 + Empty Vector) + 1 border 717 tree. Pick whichever rep is convenient; just record the block/row/position in the tube label so we can find it again if needed.

![Poplar sampling diagram — branch events and youngest leaves](plant-harvesting/images/poplar-sampling-diagram.png)

## Sampling rule

- **Branch:** preferable that the branch is **2+ branch events** from the main trunk (sub-branch off a side branch). See diagram.
- **Tissue:** youngest leaves at the **tip** of that branch (apical bud / first flush).
- **Amount:** **6 g minimum.** A loosely-filled 50 mL Falcon tube clears this easily (~15–20 g). Extra is good — gives us backup if extraction fails.
- **One tube per tree.** All tissue from the same branch tip.
- **Flash-freeze immediately** (LN2 or dry ice).
- **Collect ASAP.** Older leaves yield less reliable DNA, especially for long-read sequencing.

## Labeling

Format: **`{SITE}-{TreeRef}-{LineShort}`**

| Field | Format | Example |
| --- | --- | --- |
| `{SITE}` | `DAV` / `MAR` / `ORE` | `DAV` |
| `{TreeRef}` | `B{n}R{n}P{n}` (block/row/position) or `T{n}` (tree tag) | `B1R4P2` |
| `{LineShort}` | shorthand from the lookup table below | `CK54` |

**Examples:** `DAV-B1R4P2-CK54` · `MAR-T17-WT` · `ORE-T03-717`

**Label both the tube body AND the cap** with permanent marker. Clear labels matter most — mix-ups here can't be fixed downstream.

### Line ID lookup table

| Shorthand | Canonical | Type |
| --- | --- | --- |
| `WT` | WT717 | Untransformed control |
| `EV` | Empty Vector | Tissue-culture control |
| `CK45` / `CK54` / `CK107` | Chx20-KO #45 / #54 / #107 | Transgenic |
| `CO61` / `CO74` / `CO78` | Chx20-OE #61 / #74 / #78 | Transgenic |
| `DO29` / `DO89` / `DO214` | DIR18-OE #29 / #89 / #214 | Transgenic |
| `EO5` / `EO17` / `EO24` | EXO70C2-OE #5 / #17 / #24 | Transgenic |
| `XK1` / `XK15` / `XK59` | PtrXBAT35-KO #1 / #15 / #59 | Transgenic |
| `XO22` / `XO60` / `XO72` | PtrXBAT35-OE #22 / #60 / #72 | Transgenic |
| `717` | 717-1B4 border / spacer | Untransformed spatial control |

## Shipping

Flash-freeze on-site → store at −80 °C → ship frozen on dry ice, **Mon–Wed only**, to:

```
Grey Monroe Lab
262 Robbins Hall
150 California Ave
University of California, Davis
Davis, CA 95616 USA
Phone: 279-222-8881
```

**Two options, whichever is easier on your end:**

- **Option A — we send a prepaid label.** Email Grey **~1 day before ship date** with: tube count, gross weight (kg), box dimensions, dry ice weight (kg), ship-from address, intended ship date. We'll put a prepaid label together and email it to you to print.
- **Option B — ship on your own carrier and we'll reimburse.** Just send Grey the tracking number on ship day.

## Davis whole-canopy add-on (3 trees only)

For 3 specific Davis trees (1 WT + 1 EV + 1 most-branched transgenic), collect **5 tubes per tree** instead of 1: one from the trunk apex (`B0`) and one each from 4 major laterals top-to-bottom (`B1`–`B4`). Apply the standard sampling rule on each branch. Tube label adds the branch suffix: `DAV-B1R2P3-WT-B0`. Sketch a quick branching diagram per tree and email the photo to the lab.
