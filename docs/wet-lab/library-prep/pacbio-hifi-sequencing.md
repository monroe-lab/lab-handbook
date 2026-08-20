---
type: "protocol"
title: "PacBio HiFi Library Prep & Sequencing Submission"
---
# PacBio HiFi Library Prep & Sequencing Submission

> ℹ️ **About this protocol**
> Species-agnostic workflow for taking HMW gDNA through shearing, HiFi library prep, pooling, size selection, and submission to the UC Davis Genome Center. Species-specific decisions live upstream in the extraction protocols (step 0) and in your project's run plan (genome size, coverage, multiplexing). Restructured by Claude from the lab's Col-0 Plus run notes (see [[col-0-plus]] for the original run record) — verify volumes and steps against the official PacBio procedure checklist linked below before your first run.

## Resources

**Equipment:** [[centrifuge]], [[clean-bench-laminar-flow]]

**Kits:** [[qubit-dsdna-hs-assay-kit]]

**Reagents:** [[ethanol-70]], [[isopropyl-alcohol]], [[tween-80]]

**Consumables:** [[qubit-assay-tubes]]

**Related Protocols:** [[hifi-dna-extraction]], [[sorbitol-ctab-hifi-extraction]], [[hmw-extraction-challenging-plants]], [[ot2-hmw-shearing]], [[hmw-size-selection]], [[fiber-seq-master-protocol]]

**PacBio references:**

* [Preparing DNA for HiFi sequencing — extraction & QC technical note](https://www.pacb.com/wp-content/uploads/Technical-Note-Preparing-DNA-for-PacBio-HiFi-Sequencing-Extraction-and-Quality-Control.pdf)
* [HiFi plex prep kit 96 procedure checklist](https://www.pacb.com/wp-content/uploads/Procedure-checklist-Preparing-multiplexed-whole-genome-and-amplicon-libraries-using-the-HiFi-plex-prep-kit-96.pdf)
* [HiFi library prep technical overview](https://www.pacb.com/wp-content/uploads/Technical-overview-HiFi-library-preparation-using-HiFi-prep-kits-for-high-throughput-sequencing-on-PacBio-long-read-systems.pdf)
* [What is a SMRT cell?](https://www.pacb.com/blog/smrt-cell/)

## Step 0 — Plan the run (project-level decisions)

Before touching a pipette, settle these with your project lead. They are project decisions, not protocol steps:

* **Genome size × desired coverage × number of samples = total Gb needed.** Ask the Genome Center for the current per-SMRT-cell yield to convert that into cells and multiplexing level.
* **Which extraction protocol.** HMW extraction is where species actually matters. Use the protocol matched to your tissue: [[hifi-dna-extraction]] (Arabidopsis and other tractable tissue), [[sorbitol-ctab-hifi-extraction]], [[charcoal-ctab]], [[kalanchoe-ctab-extraction]], [[pistachio-dna-extraction]], or [[hmw-extraction-challenging-plants]] for polysaccharide/phenolic-rich material.
* **Record-keeping.** Set up a run sheet (samples, extraction dates, concentrations, barcode wells) before starting. Record adapter/barcode wells **digitally, as you go** — a lost piece of paper caused a real demultiplexing headache on a past run.

## Step 1 — HMW gDNA QC

1. Quantify extractions with Qubit **dsDNA BR** (broad range — HMW extractions are usually too concentrated for HS).
2. Check the fragment size distribution before committing to shearing. Flag any sample whose distribution runs short — short input fragments propagate into short libraries and reduce read quality and yield.

## Step 2 — Submit for pipette shearing

The Genome Center performs pipette shearing. Submission requirements:

1. Dilute each sample to **< 5 ng/µL** in 200–500 µL. Do not exceed 5 ng/µL — this matters for shearing uniformity.
2. Make all sample volumes **equal**, even if concentrations differ (best is both equal, if you can).
3. After shearing, QC again: expect a uniform distribution with a mean around ~17–22 kb (past runs: means 17.4–20.3 kb, modes 18.2–19.5 kb).

## Step 3 — Library prep (HiFi plex prep kit 96)

Follow the [PacBio procedure checklist](https://www.pacb.com/wp-content/uploads/Procedure-checklist-Preparing-multiplexed-whole-genome-and-amplicon-libraries-using-the-HiFi-plex-prep-kit-96.pdf), with these lab-learned modifications:

1. **First bead cleanup: work in tubes, not the shearing plate.** Transfer the full ~300 µL of sheared DNA to fresh lo-bind 1.5 mL tubes, then add 1× volume of SMRTbeads. (Doing the cleanup directly in the 96-well plate on the plate magnet made it hard to see residual supernatant/ethanol during discards, and made [[centrifuge]] balancing awkward — don't repeat it.)
2. Use **1 mL 80% ethanol** for wash steps.
3. **Use all your DNA at the first cleanup.** Max sequencing input is 300 ng/sample, but expect 10–30% loss at this step — going in with everything (e.g. 350 ng) is fine. Tip from Noravit at the Genome Center.
4. **Extend the repair step to 1 hour at 37 °C** (the checklist says 30 min; some labs run it at RT). Also a Noravit recommendation — improves library yield.
5. **Barcodes: use a fresh index plate if at all possible.** A re-used, much-handled 96-well adapter plate is the suspected cause of a large non-barcoded read fraction on a past run (cross-contamination between wells). At minimum, seal carefully and log every well used.

## Step 4 — Pooling and size selection

1. Pool barcoded libraries; final pool volume **25 µL** (the maximum LightBench input volume).
2. Provide **at least 1 µg in 25 µL** for LightBench size selection (Oanh, Genome Center: "to be on the safe side"). If the pool is short of this, sequencing and size selection both suffer — a past 253 ng pool was flagged as too low.
3. Keep size distributions **consistent across samples in a pool** — shorter-fragment samples drag down read quality and yield for the whole pool.
4. Typical LightBench cutoff for these libraries: **< 12 kb removed**. Confirm the cutoff with the Genome Center for your run.
5. If combining pools, concentrate with SMRTbell cleanup beads at 1× and re-quantify.

## Step 5 — Final QC and submission

1. Quantify the final pool with Qubit **dsDNA 1X HS**.
2. Sanity-check the size distribution: is the **median** read length close to the mean, or much lower? A median well below the mean means a short-fragment shoulder that will cost yield (see the [technical overview](https://www.pacb.com/wp-content/uploads/Technical-overview-HiFi-library-preparation-using-HiFi-prep-kits-for-high-throughput-sequencing-on-PacBio-long-read-systems.pdf)).
3. Submit with the run sheet: sample ↔ barcode-well mapping, concentrations, expected genome sizes.

## Common pitfalls

* Bead cleanups on the shearing plate (see step 3.1) — do them in tubes.
* Re-used barcode plates → non-barcoded/misassigned reads at demultiplexing.
* Barcode records on paper → unrecoverable if lost; keep the run sheet current as you pipette.
* Low-concentration samples can be consumed entirely by the first library prep attempt, leaving nothing for a re-prep — check remaining mass before committing marginal samples to a pool.

## Example run record

The Col-0 Plus panel (11 Col-0/derivative samples, Oct 2025 – Jan 2026) is the run this protocol was distilled from, including the QC numbers and the demultiplexing postmortem: [[col-0-plus]] · [Col-0 HMW gDNA extractions & libraries sheet](https://docs.google.com/spreadsheets/d/1nWy1T0GWThBWpcfzS10ANcgUsvvXtHLdVDAryb4O0ow/edit?usp=sharing)
