---
type: protocol
title: "Sierra Gold TC Tissue Harvest"
---

# Sierra Gold TC Tissue Harvest

Tissue-collection protocol for the [[sierra-gold-tc-chromosome-stability|Sierra Gold TC Chromosome Stability]] project. We sample tissue-culture plantlets from Sierra Gold's UCB-1, Yankee, Nelson, and Platinum lines into pre-labeled 15 mL falcon tubes, ~5 plantlets per tube, all plantlets in a tube coming from a single callus cluster. Tissue is then prepped through the [[qiagen-dneasy-extraction|Qiagen DNeasy 96 Plant Kit]] for short-read sequencing.

## Resources

**Equipment:** Fine scissors (sterilized), forceps, [[ethanol-70]] wash bottle, paper towels, camera/phone for box photos, label printer or pre-printed stickers

**Supplies:** Pre-labeled **15 mL falcon tubes** (one per harvest unit), tube rack, sharpie, gloves

**Reagents:** [[ethanol-70|70% ethanol]] (for tool sterilization between calluses)

**Storage:** [[freezer-minus80-a]] (post-harvest); see project page for assigned shelf / box

**Related:** [[sierra-gold-tc-chromosome-stability]], [[qiagen-dneasy-extraction]], [[tube-and-sample-labeling]]

**Prerequisites:** Sierra Gold TC containers on the bench (current location: lab windowsill), pre-printed stickers matching the sample IDs that will be logged in the handbook

## Time estimate

**Wall time:** ~10–20 min per source TC container (depending on plantlet density and how many tubes you pull from it). Plan in batches — work through one box at a time.

## Background

Each TC container holds many plantlets, often growing in **callus clusters** — a callus ball at the base with multiple plantlet branches emerging from it. Plantlets that share a callus share a recent clonal ancestor and are the natural sampling unit for chromosome-instability work. Plantlets from *different* callus clusters in the same container are genetically more distant — they may be propagation rounds apart — and mixing them into one tube blurs the signal we're trying to measure.

**The rule:** all tissue going into a single falcon tube must come from a single callus cluster. If a tube contains plantlets from more than one callus, the sample is no longer informative for within-callus instability. If you're not sure, take fewer plantlets, write a note, and move on.

## Tissue target per tube

We are extracting through the **Qiagen DNeasy 96 Plant Kit**, which calls for **50–100 mg fresh tissue per well**. For TC plantlets, that's roughly:

| Plantlet size | Number of plantlets needed |
|---|---|
| Vigorous, larger plantlets (e.g. Platinum 18, Yankee 20) | ~3–5 plantlets |
| Small / low-proliferation plantlets (e.g. Platinum 23/24, FRP Clonal UCB-1 23) | ~5–8 plantlets if available, all from the same callus |

Five plantlets per tube is the working target. Adjust if plantlets are tiny or huge. If a callus only yields 2–3 plantlets, take what's there and note it. **Don't pad the tube with material from a different callus.**

## Procedure

### 1. Set up

1. Gather everything from Resources at one bench station. Sterilize scissors with 70% ethanol before starting.
2. Pull the pre-labeled 15 mL falcons for the boxes you're going to work through today. Confirm each sticker ID matches the handbook entry you'll be filling in.
3. Open a tab to the [editor](../editor/) so you can log each sample as you go, while everything is fresh.

### 2. Photograph the source container

**Every time you take samples from a source TC container, photograph it first.** This is non-negotiable — it's how we trace any weird result back to which physical box it came from.

1. Place the source container so the label (line name, init year, batch, proliferation date) is clearly readable.
2. Take a photo, framed so the entire label is in focus and legible.
3. Save the photo to the project folder: `docs/projects/sierra-gold-tc-chromosome-stability/boxes/<line-init>-<box-tag>-<YYYY-MM-DD>.jpg` (create the `boxes/` subfolder if it doesn't exist yet).
4. The photo path goes into the handbook entries for every sample you draw from that box.

### 3. Identify a callus cluster

1. Open the lid carefully — TC containers are not strictly sterile at this stage (we're heading to DNA extraction, not re-culture), but try not to contaminate the medium for later passages of the same line.
2. Look at the plantlets and find a clear callus cluster — a callus ball with multiple plantlets emerging from one base. The callus is the small lump of undifferentiated tissue at the root end; plantlets that share it share a callus.
3. If the container is overgrown and callus boundaries are not obvious, do your best. Then write a note.

### 4. Cut and bag

1. With sterile scissors, cut **3–5 plantlets from the same callus** (more if plantlets are small). Cut at the base of each plantlet, leaving the callus in place if you can — Sierra Gold may want to keep these containers alive.
2. With forceps (or just by tipping the cut plantlets in), drop the tissue into the pre-labeled 15 mL falcon. The scissor tip itself can also go briefly into the tube if it's helpful to get tissue off the blade.
3. Cap the tube. Place it back in the rack.
4. **Wipe scissors with 70% ethanol between callus clusters and between source containers.** Cross-contamination between samples would scramble the project.

### 5. Log the sample

Immediately log the sample in the handbook so the metadata is captured while you remember it. Create a new accession entry under `docs/accessions/` using the template below. Key fields:

- **`accession_id`** — matches the sticker on the tube.
- **`source_container_label`** — exactly what's on the source TC box (e.g. `Platinum 18 — Proliferation 03/31/2024 — Batch BP87 S33...`).
- **`source_line`** — Yankee | Platinum | UCB-1 FRP Clonal | Nelson.
- **`source_init_year`** — the TC initiation year printed on the box.
- **`source_box_photo`** — relative path to the photo from Step 2.
- **`callus_notes`** — a sentence or two about callus confidence. Free text. Examples:
  - "Single clear callus, 5 plantlets, no ambiguity."
  - "Callus boundary unclear, took 4 plantlets I'm 80% sure share a callus."
  - "Took plantlets from what looked like one callus but two of them had unusually narrow leaves — note for later."
- **`weird`** — boolean-ish flag. Set to `true` if anything looked unusual (morphology, color, vitrification, etc.) and write what.
- **`harvest_date`**, **`harvester`**.

If you're unsure whether the plantlets share a callus, **write the note**. A short flag now saves us hours of confusion later when we're trying to explain a weird signal.

### 6. Handle weird material

If you see anything unusual — albino patches, vitrified (glassy) tissue, hyperhydric blobs, unusual morphology, contamination — collect it anyway, but:

1. Note it explicitly in `callus_notes` and set `weird: true`.
2. Take an extra close-up photo of the plantlet(s) before cutting, save it next to the box photo with `-detail` in the filename.

We want these in the dataset, not excluded. The weird ones are exactly where chromosome instability might surface.

### 7. Storage

Once a batch is logged, move the rack of falcons to **-80 °C Freezer A**, top shelf (or wherever the project storage assignment currently is — check the project page). Re-confirm the parent location on each handbook entry matches where the tube physically ends up.

Tissue must not thaw between harvest and extraction. If you're collecting and not extracting same-day, freeze the moment you're done with the batch.

## Sample entry template

Copy this into `docs/accessions/<accession-id>.md` for each falcon tube:

```yaml
---
type: accession
title: "<accession-id>"
accession_id: "<accession-id>"
project: "Sierra Gold TC Chromosome Stability"
species: "Pistacia integerrima / hybrid (per line)"
source_line: "<Yankee | Platinum | UCB-1 FRP Clonal | Nelson>"
source_init_year: <YYYY>
source_container_label: "<full label text>"
source_box_photo: "projects/sierra-gold-tc-chromosome-stability/boxes/<filename>.jpg"
callus_notes: "<one or two sentences>"
weird: false
harvest_date: "<YYYY-MM-DD>"
harvester: "<name>"
plantlet_count: 5
parent: "locations/<storage location>"
status: "collected"
last_updated: "<YYYY-MM-DD>"
---

# <accession-id>

Brief free-text notes if useful (otherwise leave empty).
```

## Common errors

| Error | Consequence | How to avoid |
|---|---|---|
| Plantlets in one tube from different calluses | Sample no longer informative for within-callus instability | Identify the callus first. If unclear, take fewer plantlets and note it. |
| No photo of source box | Can't trace a weird result back to the physical container | Always photograph before opening the lid |
| Scissors not cleaned between calluses | Cross-contamination between samples | 70% ethanol wipe every time |
| Forgot to log right after sampling | Metadata drift, lost photo path | Log in the handbook before moving on to the next tube |
| Tissue thawed between bench and -80 | Degraded DNA | Move the rack to -80 immediately after the batch |

## Documentation

Each falcon tube gets its own handbook entry (template above). The project page ([[sierra-gold-tc-chromosome-stability]]) will pull these in as the sample list. Photos of each source box live under `docs/projects/sierra-gold-tc-chromosome-stability/boxes/` and are referenced from each accession that drew from that box.

---

*Drafted by Claude on 2026-05-12 from Grey's lab instructions. Edit freely as the protocol gets refined in practice.*
