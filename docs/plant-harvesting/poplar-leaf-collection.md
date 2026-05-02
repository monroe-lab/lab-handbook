---
---
***

# Collecting Poplar Leaves for Somatic Mutation Sequencing

**Purpose:** Collect and label leaf tissue from field-grown poplar trees for whole-genome somatic mutation sequencing in the Monroe Lab for the CBI / JGI 512691 project. Shipping to UC Davis is covered separately in [[shipping/shipping-samples-to-monroe-lab]].

> **Updated 2026-05-02** after the JGI initiation call (proposal 512691). Earlier "two adjacent clusters" design retired.

## Quick summary

Preferences (not rigid rules — approximate is fine):

1. **Pick a branched branch** on the tree. **Preferable:** a branch separated from the main stem by **2 or more branch events** (a sub-branch off a side branch off the main trunk). See diagram below.
2. **Take the youngest leaves** at the tip of that branch — the apical bud / first-flush tissue at the very end of the shoot.
3. Strip leaves into a **50 mL Falcon tube** (or equivalent — envelope, foil pouch, whatever you've got). **Fill it loose**, not packed.
4. **Minimum 6 g of tissue.** A loosely-filled 50 mL Falcon tube clears that easily (~15–20 g) — extra is good, gives us backup tissue if extraction has issues.
5. **All tissue from the same branch tip.** Don't mix across branches or trees.
6. **Flash-freeze immediately** (liquid nitrogen or directly on dry ice).
7. Label clearly. Record block / row / position (or tree tag) and the line ID in the sample sheet.
8. Ship frozen on dry ice to the Monroe Lab at UC Davis (see [[shipping/shipping-samples-to-monroe-lab]]).

> ⚠️ **Collect ASAP.** JGI strongly recommends collecting on the earliest reasonable timeline. Older leaves accumulate secondary metabolites that yield less reliable DNA extractions, especially for the long-read libraries.

> 📝 **Davis only:** 3 trees (1 WT717 + 1 Empty Vector + 1 most-branched transgenic) get an additional **whole-canopy collection** — see [Davis whole-canopy collection](#davis-whole-canopy-collection-3-trees-only) section near the bottom of this protocol.

![Poplar sampling diagram — branch events and youngest leaves](plant-harvesting/images/poplar-sampling-diagram.png)

<br>
***

## Why this sampling design

We're trying to detect somatic mutations that arose before, during, and after tissue culture and now in the field. Two design choices:

* **Most-branched branch.** Each new axillary branch is founded by a small handful of cells from the parent meristem — a cellular bottleneck that "fixes" any mutations in the new lineage. The more bottlenecks between trunk and tip, the more likely a somatic mutation is at high VAF (close to fixed) and easy to call from sequencing.
* **Youngest tissue at the branch tip.** Per JGI guidance for poplar (initiation call 2026-04-29): poplar leaves accumulate secondary metabolites (polyphenols / polysaccharides) that interfere with DNA extraction. The youngest tissue at the very tip of the shoot has the lowest secondary-metabolite load and the highest DNA yield, and is what JGI / HudsonAlpha need for HMW DNA → PacBio HiFi.

## Procedure

### 1\. Select the tree

For each line: find any healthy tree of that line. If a specific tree from the field map is dead, missing, or hard to reach, **just pick another tree of the same line**. Record block / row / position (or tree tag).

### 2\. Select the branch

Scan the canopy and find the **branch with the most branching events between its tip and the main trunk** — typically a sub-branch off a side branch off the main stem, ideally several bifurcations deep. If multiple branches look comparably branched, pick the bushiest / most vigorous one.

Avoid:

* Branches with obvious stress, damage, or disease
* Suckers from the very base of the trunk (often a different cell lineage)
* Heavily defoliated or dieback branches

### 3\. Collect the youngest leaves from the branch tip

At the **tip of your chosen branch**, find the **apical bud** — the cluster of newest, smallest, still-expanding leaves at the very end of the shoot. This is the "first flush" tissue.

* **Youngest available, healthy.** Avoid damaged, diseased, or insect-eaten tissue.
* **Just the freshest growth.** Skip older, fully-hardened leaves further down the branch.
* **All tissue from the one branch tip.** Don't combine across branches or trees.
* **One tube per tree.**

### 4\. Strip and bag

For each tree:

1. **Strip the leaf blades and immature leaflets from the petiole and stem.** Collect blade tissue only — no woody stem.
2. Drop the tissue directly into a **50 mL Falcon tube** or equivalent (foil pouches work too — same idea). Fill it loose, not packed; approximate is fine. A loosely-filled 50 mL Falcon is plenty (~15–20 g of fresh young leaves).
3. Label per the section below.
4. **Flash-freeze immediately** in liquid nitrogen or directly on dry ice.

> ⚠️ **Avoid cross-contamination between trees.** If using scissors / shears, clean with 70% ethanol between trees.

### 5\. Label the tubes

Every tube gets a unique ID. Format for standard collection:
**`{SITE}-{TreeRef}-{LineShort}`**

| Field | What it is | Example |
| ----- | ---------- | ------- |
| `{SITE}` | 3-letter site code | `DAV`, `MAR`, `ORE` |
| `{TreeRef}` | Block/row/position concatenated as `B{n}R{n}P{n}`, OR the tree's field tag as `T{n}` if you don't have block/row/position | `B1R4P2` or `T17` |
| `{LineShort}` | Shorthand line code (see lookup table below) | `CK54` |

**Examples:**

* `DAV-B1R4P2-CK54` — Davis, Block 1 Row 4 Position 2, CHX20-KO event 54
* `MAR-T17-CK54` — Maryland, tree tag T17, CHX20-KO event 54
* `DAV-B3R8P5-WT` — Davis, Block 3 Row 8 Position 5, wild-type 717
* `ORE-T03-717` — Oregon, tree tag T03, border 717 spacer

For **Davis whole-canopy trees** (see next section), tube IDs add a branch suffix:
**`{SITE}-{TreeRef}-{LineShort}-{Branch}`** where `{Branch}` is `B0` for the trunk-apex meristem and `B1…B4` for the four major laterals.

* `DAV-B1R2P3-WT-B0` — trunk-apex tube
* `DAV-B1R2P3-WT-B1` — top-most lateral
* `DAV-B1R2P3-WT-B4` — bottom-most lateral

Write the ID with permanent marker (or printed sticker) on the **tube body *and the cap*** (or both sides of the foil pouch).

***

## Davis whole-canopy collection (3 trees only)

In addition to the standard one-tube-per-tree collection above, three Davis trees get a **whole-canopy collection** to test the hypothesis that mutations in the trunk-apex meristem are fixed across all lateral branches. Sampling each branch separately lets us see how mutations spread through the canopy.

**Which 3 trees:** 1 × WT717 + 1 × Empty Vector + 1 × any transgenic event (whichever individual tree happens to have the most branches in the field — line identity doesn't matter for the transgenic, branchiness does). Marie / Zi to pick at collection time.

**What to collect per canopy tree (5 tubes per tree, 15 tubes total across the 3 trees):**

1. **`B0` — trunk-apex meristem.** The terminal meristem at the very top of the main stem. Take the youngest leaves / unfurling buds at the trunk apex; fill a 50 mL Falcon tube loose.
2. **`B1`, `B2`, `B3`, `B4` — four major laterals top-to-bottom.** Pick the four most prominent lateral branches distributed along the trunk (e.g., one near the top, two mid, one near the base). For each lateral, follow the standard rule: most-branched part of that lateral, youngest leaves at the tip, fill a 50 mL Falcon tube loose.

**Branching diagram:** Sketch a quick diagram of the tree showing the trunk and the 4 laterals you sampled, with `B1`–`B4` labels and approximate height / orientation on the trunk. Take a phone photo of the diagram and email it to the Monroe lab. This is the key reference for analysis.

**Same flash-freeze + labeling rules as standard collection.** Five labeled tubes per canopy tree, all flash-frozen on dry ice / LN2 immediately, all shipped together.

**Why 5 branches:** Five tubes per tree (1 trunk apex + 4 laterals) is enough to test the trunk-fixation hypothesis: a mutation present in `B0` and all 4 laterals → fixed in trunk meristem; a mutation in `B0` only → meristem-private; a mutation in 1 lateral only → branch-private; a mutation in `B0` + some laterals → partial trunk fixation.

**Sequencing assignment for canopy trees:** Each branch tube generates one Illumina library (5 per canopy tree × 3 trees = 15 Illumina). Each canopy tree's `B0` (trunk apex) tube *also* generates one PacBio HiFi library, made from the same DNA prep — that's the cross-platform validation pair.

***

## Line ID lookup table

The **shorthand** code goes on the tube label.

| Shorthand | Canonical | Type |
| --------- | --------- | ---- |
| `WT` | `WT717` | Untransformed control |
| `EV` | `Empty Vector` | Tissue-culture control |
| `CK45` | `Chx20, KO # 45` | Transgenic |
| `CK54` | `Chx20, KO # 54` | Transgenic |
| `CK107` | `Chx20, KO # 107` | Transgenic |
| `CO61` | `Chx20, OE # 61` | Transgenic |
| `CO74` | `Chx20, OE # 74` | Transgenic |
| `CO78` | `Chx20, OE # 78` | Transgenic |
| `DO29` | `DIR18-OE_29` | Transgenic |
| `DO89` | `DIR18-OE_89` | Transgenic |
| `DO214` | `DIR18-OE_214` | Transgenic |
| `EO5` | `EXO70C2-OE_5` | Transgenic |
| `EO17` | `EXO70C2-OE_17` | Transgenic |
| `EO24` | `EXO70C2-OE_24` | Transgenic |
| `XK1` | `PtrXBAT35-KO #1` | Transgenic |
| `XK15` | `PtrXBAT35-KO #15` | Transgenic |
| `XK59` | `PtrXBAT35-KO #59` | Transgenic |
| `XO22` | `PtrXBAT35-OE #22` | Transgenic |
| `XO60` | `PtrXBAT35-OE #60` | Transgenic |
| `XO72` | `PtrXBAT35-OE #72` | Transgenic |
| `717` | (border / spacer 717-1B4 from a guard row) | Untransformed spatial control |

***

## Preservation / Shipping

**Required: flash-freeze on-site.** Drop each tube/pouch into liquid nitrogen or directly onto dry ice immediately after the tissue goes in. Transfer to a −80 °C freezer as soon as you're back from the field.

Ship per [[shipping/shipping-samples-to-monroe-lab]] — frozen on dry ice, overnight, Monday through Wednesday only. All sites ship to the Monroe Lab at UC Davis.

***

## Site-by-site coverage

| Site | Trees | Notes |
|---|---|---|
| **UC Davis** | 44 (41 standard + 3 whole-canopy) | Standard collection on 41 trees; 3 trees (WT, EV, 1 most-branched transgenic) also get a 5-tube whole-canopy collection. Coordinated by [[Marie Klein]] + Zi Ye. |
| **UMES (Maryland)** | 21 | 1 tree per line (18 transgenic events + WT + EV) + 1 border 717 guard tree. Standard collection only. Marie is the project liaison. |
| **Westport (Oregon)** | 21 | Same as UMES: 1 tree per line + 1 border 717 guard. Standard collection only. Marie is the project liaison. |
