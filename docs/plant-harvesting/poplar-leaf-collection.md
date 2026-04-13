---
---
***

***

***

***

# Collecting Poplar Leaves for Somatic Mutation Sequencing

**Purpose:** Collect and label leaf tissue from field-grown poplar trees for whole-genome somatic mutation sequencing in the Monroe Lab. This protocol covers tree selection, leaf-cluster choice, labeling, and on-site preservation. Shipping to UC Davis is covered separately in [[shipping/shipping-samples-to-monroe-lab]].

**Project context:** Currently used for the Poplar Somatic Sequencing project (April 2026 collection round). It's also written as a generic reference for any future leaf-based somatic mutation sampling in poplar — feel free to point future collaborators here.

***

## Quick summary

For each tree:

1. Find a healthy side branch, ideally with **multiple branching events** between it and the main trunk
2. On that branch, find **two adjacent young leaf clusters**
3. Strip the leaves off — **leaves only, no stem, please** — and place each cluster in its own labeled tube or envelope
4. **Flash-freeze immediately** if possible (liquid nitrogen or directly on dry ice)
5. Record block / row / position (or tree tag) and the line ID in the sample sheet

That's it. Two tubes per tree. Don't worry about which goes to short-read vs. long-read sequencing — we figure that out in the lab.

![Two adjacent leaf clusters on the same shoot, each going into its own tube](plant-harvesting/images/poplar-leaf-clusters.png)

***

## Why we sample this way (the very short version)

We're trying to detect somatic mutations, that arose in a single cell during the tree's life and got passed down to all the cells that descended from it. The cleaner a mutation's "footprint" in the tissue we sequence, the easier it is to call from the data. Two design choices follow:

* **Pick a branch several branching events out from the main trunk.** Each new axillary branch is founded by a small handful of cells from the parent meristem. That cellular bottleneck "fixes" any mutations from those founder cells across the whole new branch's lineage. The more bottlenecks between trunk and leaf, the more likely a somatic mutation is at high VAF (close to fixed) rather than chimeric (present in only some cells of the leaf). High-VAF mutations are much easier to call reliably from sequencing. So: deeper in the branching hierarchy = better signal.
* **Two adjacent clusters on the same shoot.** Same branching history, so the two samples are nearly identical biologically. They serve as backup of each other and we can split them later between short-read and long-read library prep without confounding the comparison.
* **Young, fully-expanded leaves.** Best DNA yield, and lower polyphenol/polysaccharide load than older leaves.
* **Leaves only, no stem or petiole.** Stem tissue is high in polyphenols and polysaccharides that inhibit DNA extraction.

That's the whole biology. Everything below is logistics.

***

## Materials

You provide:

* **Tubes or envelopes** — one per leaf cluster, two per tree. Any clean dry container works as long as it can take a label and survive freezing. 5 mL screw-cap tubes are great; small coin envelopes work too if you flash-freeze them.
* **Permanent marker (Sharpie).** Pencil and ballpoint pen smear or fade — don't use them.
* **Liquid nitrogen dewar OR dry ice in a cooler** — for immediate flash-freezing on-site
* **Clean nitrile gloves**, scissors or secateurs, and 70% ethanol wipes for cleaning between trees
* **Camera** (phone is fine) for tree-tag photos
* **Sample sheet** — printed copy of the table below, one row per tube, on a clipboard

Need any of this? Email Grey at `gmonroe@ucdavis.edu` and we'll arrange to get supplies to you.

***

## Procedure

### 1\. Select the tree

You will receive a list of lines to sample for your site (e.g., "1 tree per line + 1 border 717 spacer"). For each line on your list:

1. Find any healthy tree of that line. If you have a specific suggested tree from the field map, great — use it. **If that tree is dead, missing, or hard to reach, just pick another tree of the same line.** Line ID is what matters, not tree position.
2. Take **two photos** of the tree: one of the tag/label (so we can verify identity), one wider shot of the whole tree. Phone camera is fine.
3. Record **block, row, position** from the field map if you have it; otherwise record the tree's physical tag number.

### 2\. Select the branch

On the tree, look for a **side branch with at least one — and ideally several — branching events between it and the main trunk.** In poplar this usually means: pick a sub-branch off a side branch off the main stem.

![Doesn't have to be perfect, but finding the "most branched branch" (least apical) is the goal](plant-harvesting/images/branch-selection.png)

Avoid:

* The main trunk's youngest growth at the apex
* Branches with obvious stress, damage, or disease
* Suckers from the very base of the trunk (often a different cell lineage)

> *Why does branching depth matter?* Each branching event is a cellular bottleneck — see the "Why we sample this way" section above. Short version: deeper branches give higher-VAF mutations, which are easier to call.

### 3\. Pick the two leaf clusters

On your chosen branch, find **two adjacent leaf clusters** — two clumps of young, fully-expanded leaves close together on the same shoot. See the photo at the top of this protocol.

* **Young, fully expanded, healthy.** Avoid damaged, diseased, or insect-eaten tissue.
* **Same shoot.** Don't sample from two different branches.
* **Each cluster goes in its own tube** as cluster 1 (`C1`) and cluster 2 (`C2`).

### 4\. Strip and bag

For each cluster:

1. **Strip the leaf blades from the petiole and stem.** Collect leaf blades only — leave the stems and petioles on the tree.
2. Drop the leaves directly into a labeled tube or envelope. No need to squash; just drop them in.
3. Label per the section below.
4. **Flash-freeze immediately** in liquid nitrogen or directly on dry ice. The DNA degrades fast at field temperatures, especially for long-read library prep.

Wipe scissors and gloves with 70% ethanol **between trees** (you don't need to clean between the two clusters of the same tree).

### 5\. Label the tubes

Every tube gets a unique ID. Format:

```
{SITE}-{TreeRef}-{LineShort}-C{Cluster}
```

| Field | What it is | Example |
| ----- | ---------- | ------- |
| `{SITE}` | 3-letter site code | `DAV`, `MAR`, `ORE` |
| `{TreeRef}` | Block/row/position concatenated as `B{n}R{n}P{n}`, OR the tree's field tag as `T{n}` if you don't have block/row/position | `B1R4P2` or `T17` |
| `{LineShort}` | Shorthand line code (see lookup table below) | `CK54` |
| `{Cluster}` | `1` or `2` | `1` |

**Examples:**

* `DAV-B1R4P2-CK54-C1` — Davis, Block 1 Row 4 Position 2, CHX20-KO event 54, cluster 1
* `MAR-T17-CK54-C1` — Maryland, tree tag T17, CHX20-KO event 54, cluster 1
* `DAV-B3R8P5-WT-C2` — Davis, Block 3 Row 8 Position 5, wild type 717, cluster 2
* `ORE-T03-717-C1` — Oregon, tree tag T03, border 717 spacer, cluster 1

Write the ID with permanent marker on the **tube body and the cap** (the cap label is your insurance against the body label fading). Also note the **collection date** and **collector initials** somewhere visible on the tube — they don't need to be in the ID itself, but they should be on each tube and in the sample sheet.

> *Tip:* Pre-printed Avery cryo labels are far more reliable than Sharpie at LN2 temperatures. If you have them, use them.

***

## Line ID lookup table

The **shorthand** code goes on the tube label (it's much shorter and more readable). The **canonical name** is the original label from Jack Bailey-Bale's field design file — keep this in your sample sheet so we can always trace back to the field design.

| Shorthand | Canonical (field map) | Construct | Type |
| --------- | --------------------- | --------- | ---- |
| `WT` | `WT717` | 717-1B4 wild type | Untransformed control |
| `EV` | `Empty Vector` | Empty vector (Cas9, no edit) | Tissue-culture control |
| `CK45` | `Chx20, KO # 45` | CHX20 knockout, event 45 | Transgenic |
| `CK54` | `Chx20, KO # 54` | CHX20 knockout, event 54 | Transgenic |
| `CK107` | `Chx20, KO # 107` | CHX20 knockout, event 107 | Transgenic |
| `CO61` | `Chx20, OE # 61` | CHX20 overexpression, event 61 | Transgenic |
| `CO74` | `Chx20, OE # 74` | CHX20 overexpression, event 74 | Transgenic |
| `CO78` | `Chx20, OE # 78` | CHX20 overexpression, event 78 | Transgenic |
| `DO29` | `DIR18-OE_29` | DIR18 overexpression, event 29 | Transgenic |
| `DO89` | `DIR18-OE_89` | DIR18 overexpression, event 89 | Transgenic |
| `DO214` | `DIR18-OE_214` | DIR18 overexpression, event 214 | Transgenic |
| `EO5` | `EXO70C2-OE_5` | EXO70C2 overexpression, event 5 | Transgenic |
| `EO17` | `EXO70C2-OE_17` | EXO70C2 overexpression, event 17 | Transgenic |
| `EO24` | `EXO70C2-OE_24` | EXO70C2 overexpression, event 24 | Transgenic |
| `XK1` | `PtrXBAT35-KO #1` | PtrXBAT35 knockout, event 1 | Transgenic |
| `XK15` | `PtrXBAT35-KO #15` | PtrXBAT35 knockout, event 15 | Transgenic |
| `XK59` | `PtrXBAT35-KO #59` | PtrXBAT35 knockout, event 59 | Transgenic |
| `XO22` | `PtrXBAT35-OE #22` | PtrXBAT35 overexpression, event 22 | Transgenic |
| `XO60` | `PtrXBAT35-OE #60` | PtrXBAT35 overexpression, event 60 | Transgenic |
| `XO72` | `PtrXBAT35-OE #72` | PtrXBAT35 overexpression, event 72 | Transgenic |
| `717` | (border / spacer 717-1B4 from a guard row) | 717-1B4 | Untransformed spatial control |

**Code convention:** First letter = gene (C = CHX20, D = DIR18, E = EXO70C2, X = PtrXBAT35). Second letter = K (knockout) or O (overexpression). Number = event ID.

***

## Sample sheet (mock — fill in for your collection)

Print this and bring it with you. **One row per tube**, so each tree contributes two rows. Cross-check tube labels against the table before packing.

| sample\_id | site | block | row | position | tree\_tag | line\_short | line\_canonical | cluster | collection\_date | collector | notes |
| --------- | ---- | ----- | --- | -------- | -------- | ---------- | -------------- | ------- | --------------- | --------- | ----- |
| `DAV-B1R4P2-CK54-C1` | DAV | 1 | 4 | 2 | — | CK54 | `Chx20, KO # 54` | 1 | 2026-04-15 | ZY | sub-branch off SE side, 3 branching events deep |
| `DAV-B1R4P2-CK54-C2` | DAV | 1 | 4 | 2 | — | CK54 | `Chx20, KO # 54` | 2 | 2026-04-15 | ZY | adjacent cluster, same shoot |
| `DAV-B2R6P3-WT-C1` | DAV | 2 | 6 | 3 | — | WT | `WT717` | 1 | 2026-04-15 | ZY |  |
| `DAV-B2R6P3-WT-C2` | DAV | 2 | 6 | 3 | — | WT | `WT717` | 2 | 2026-04-15 | ZY |  |
| `MAR-T17-EO5-C1` | MAR | — | — | — | T17 | EO5 | `EXO70C2-OE_5` | 1 | 2026-04-16 | JK | tag faded, photographed for verification |
| `MAR-T17-EO5-C2` | MAR | — | — | — | T17 | EO5 | `EXO70C2-OE_5` | 2 | 2026-04-16 | JK |  |
| `ORE-T03-717-C1` | ORE | — | — | — | T03 | 717 | (border 717-1B4) | 1 | 2026-04-17 | BS | west edge border tree |
| `ORE-T03-717-C2` | ORE | — | — | — | T03 | 717 | (border 717-1B4) | 2 | 2026-04-17 | BS |  |

When you ship, **email a copy of the filled sheet to `gmonroe@ucdavis.edu`** (CSV or photo of the printed page is fine), and put a printed copy inside the box too.

***

## Preservation

**Required: flash-freeze on-site.** Drop each tube into liquid nitrogen or directly onto dry ice **immediately** after the leaves go in. Transfer to a −80 °C freezer as soon as you're back from the field.

> *No LN2 or dry ice available?* Stop and email Grey before improvising. We need flash-frozen tissue for the long-read library prep, and silica desiccation will not work for this round. We can ship you dry ice or work out an alternative.

Ship per [[shipping/shipping-samples-to-monroe-lab]] — frozen on dry ice, overnight, Monday through Wednesday only.

***

## Troubleshooting

> *The listed tree is dead, missing, or hard to reach.* Pick any other healthy tree of the same line. Record what you actually sampled in the sheet. Line ID is what matters.

> *Can't find a branch with multiple branching events.* Pick the most-branched side branch you can find and note it in the `notes` column. Don't sample from the main trunk apex.

> *Two adjacent clusters of the right age don't exist on the same shoot.* Pick the two closest clusters on the same branch and note the deviation.

> *Tree tag is unreadable or missing.* Photograph what's there, photograph the surrounding area for context, and email Grey before collecting from that tree. Mis-identification is the single most damaging error in this experiment — better to skip a tree than guess.

> *Sharpie label is rubbing off the frozen tube.* Use cryo labels if you have them. As backup, write the ID on lab tape and cover with clear tape, or write on the cap as well as the body.

***

## See also

* [[shipping/shipping-samples-to-monroe-lab]] — packaging, dry ice, prepaid label workflow
* Project-specific sampling assignments live in the project repo (`docs/experimental_design.md`), not here — this protocol is the generic "how", and the project doc is the specific "where" and "how many"