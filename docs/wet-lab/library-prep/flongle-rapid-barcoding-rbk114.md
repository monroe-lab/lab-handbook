---
type: protocol
title: "Multiplexed Flongle Library Prep (SQK-RBK114.24)"
---

# Multiplexed Flongle Library Prep (SQK-RBK114.24)

**Purpose:** Prepare a multiplexed Oxford Nanopore library from up to 24 sheared HMW DNA samples for size QC on a Flongle flow cell. Step 3 of the [[in-house-hifi-shearing-pipeline]]. Manual version below; an OT-2 automated version is planned.

**Source:** Oxford Nanopore [Rapid Sequencing gDNA Barcoding (SQK-RBK114.24)](https://nanoporetech.com/document/rapid-sequencing-gdna-barcoding-sqk-rbk114).

## Background

The [[sqk-rbk114-24]] kit uses a transposase fused to a barcoded adapter to tag and ligate adapters in a single 6-minute reaction. Each barcode (RB01-RB24) is loaded into a different sample, then all reactions are pooled and the Rapid Adapter is added to the pool. The pooled library loads onto one [[flongle-flow-cells-flo-flg114]] and basecalling separates samples by barcode after the run.

A nanopore read length equals the actual molecule length, so the read-length histogram from this prep is a direct, honest measurement of the upstream shearing distribution. There is one known artifact: the AMPure XP cleanup of the pooled library has a small high-end size bias because fragments >30 kb don't elute fully. This is a constant offset, characterized in [[in-house-hifi-shearing]] § Validation Phase.

> **Do not buy [[sqk-rbk114-24]] alternatives by mistake.** SQK-RAD114 is the single-sample rapid kit (no barcoding, wrong workflow). SQK-RBK114.96 is the 96-plex version (overkill for our batch sizes). The right kit is **SQK-RBK114.24**.

## Required input

- ~50 ng of sheared DNA per sample (from the QC aliquot in [[ot2-hmw-shearing]] § 5)
- 1-24 samples total
- Quantified on [[qubit-fluorometer]] with [[qubit-dsdna-hs-assay-kit]] so the input is real

## Required materials

### Equipment
- [[opentrons-ot2]] with [[ot2-temperature-module]] (GEN2) and [[ot2-magnetic-module]] (GEN2) — used for tagging and pooled cleanup in the automated version; manual version uses bench thermocycler and [[magnetic-rack]]
- [[thermocycler]] (manual version)
- [[magnetic-rack]] (manual version)
- [[qubit-fluorometer]]

### Reagents and kits
- [[sqk-rbk114-24]] (Rapid Barcoding Kit 24 V14, includes barcodes RB01-RB24, Rapid Adapter, and the prep buffers)
- [[ampure-xp-beads]]
- [[nuclease-free-water]]
- [[qubit-dsdna-hs-assay-kit]]
- 70% ethanol (made fresh from [[ethanol-absolute]])

### Consumables
- [[pcr-strip-tubes-0-2ml]] for per-sample tagging reactions
- [[dna-lobind-tubes]] for the pooled library
- [[wide-bore-filter-tips-p200]]
- [[wide-bore-filter-tips-p1000]]
- [[qubit-assay-tubes]]

## Procedure (manual version)

### 1. Quantify the sheared aliquots

1. [[qubit-fluorometer]] each aliquot with [[qubit-dsdna-hs-assay-kit]].
2. Calculate the volume needed for **~50 ng** of each sample. If a sample is too dilute, concentrate by SpeedVac or use a larger input volume.

### 2. Per-sample transposase tagging

1. In a [[pcr-strip-tubes-0-2ml]] strip, set up one reaction per sample:
   - 9 µL sheared DNA (~50 ng) topped with [[nuclease-free-water]] if needed
   - 1 µL of one Rapid Barcode (RB01-RB24, one unique barcode per sample) from [[sqk-rbk114-24]]
2. Mix gently with [[wide-bore-filter-tips-p200]]. Do not vortex.
3. Run on the [[thermocycler]]:
   - **5 min @ 30 °C** (transposase tagging)
   - **1 min @ 80 °C** (transposase inactivation)
   - Hold at 4 °C
4. **Do not extend the 30 °C step.** Longer tagging skews the size distribution shorter and lies to your QC. This is the single most common way to get a bad calibration.

### 3. Pool

1. Combine all barcoded reactions into a single [[dna-lobind-tubes]] tube using [[wide-bore-filter-tips-p200]].
2. Mix gently by inversion (no vortex).

### 4. AMPure XP cleanup of pool

Use the **same bead ratio every time**. The validation phase locks in the offset for this exact ratio; changing it invalidates the calibration.

1. Add **0.6 × volume** of [[ampure-xp-beads]] to the pool. (For 24 × 10 µL = 240 µL pool, add 144 µL beads.)
2. Mix gently by flicking. Incubate 5 min at room temperature.
3. Place on [[magnetic-rack]]. Wait until the supernatant is clear (~5 min).
4. Remove and discard supernatant.
5. Wash 2× with 200 µL fresh 70% ethanol on the magnet. Do not disturb the bead pellet.
6. Air-dry the pellet for ~30 s. **Do not over-dry** — cracks in the pellet kill yield.
7. Remove from magnet, resuspend in **15 µL** [[nuclease-free-water]]. Incubate 2 min.
8. Place back on magnet, transfer **14 µL** of clear eluate to a fresh [[dna-lobind-tubes]] tube.
9. Quantify on the [[qubit-fluorometer]]: target is 5-50 ng/µL in 14 µL.

### 5. Add Rapid Adapter

1. To the cleaned pool (14 µL), add **1 µL** of Rapid Adapter (RA) from [[sqk-rbk114-24]].
2. Mix gently by flicking.
3. Incubate **5 min at room temperature**.
4. Keep on ice and proceed immediately to [[flongle-sequencing-and-analysis]]. The adapter-loaded library is best fresh; don't freeze.

## Notes on the AMPure size bias

[[ampure-xp-beads]] elute large fragments inefficiently. For HMW input, this means the recovered library is slightly biased toward smaller fragments compared to the true upstream distribution. This is a **constant offset, not noise** — the validation phase ([[in-house-hifi-shearing]] § Validation Phase) characterizes it once against a parallel FemtoPulse trace, and the offset is then applied as a correction factor when interpreting Flongle histograms in production. Until the validation is logged, treat Flongle means as a slight underestimate of true mean size.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Yield <2 ng/µL after cleanup | Over-dried beads, lost pellet, or input too low | Check input quant, don't over-dry |
| Library mean shifted small vs. expected | Extended 30 °C tagging, narrow tips somewhere | Don't extend tagging, use wide-bore tips |
| Uneven barcodes after demux | Input quant was off | Re-Qubit before pooling next time |
| No reads for one barcode | Wrong barcode added or reaction lost | Track barcode-to-sample mapping carefully |
| Bubbles in eluate | Pipetted too fast | Slow down |

## Safety

Standard BSL1. Ethanol is flammable.

## Automated version (planned)

A single OT-2 mega-protocol will eventually chain normalization → shearing ([[ot2-hmw-shearing]]) → barcoding → pooling → AMPure cleanup → adapter addition into one continuous run using [[ot2-temperature-module]] and [[ot2-magnetic-module]]. Hands-on time drops from ~45 min to ~10 min. Out of scope for the first validation; build after the manual workflow is calibrated.

## See also

- [[ot2-hmw-shearing]]
- [[flongle-sequencing-and-analysis]]
- [[in-house-hifi-shearing-pipeline]]
- Oxford Nanopore [SQK-RBK114.24 protocol](https://nanoporetech.com/document/rapid-sequencing-gdna-barcoding-sqk-rbk114)
- [SQK-RBK114.24 store page](https://store.nanoporetech.com/rapid-barcoding-sequencing-kit-24-v14.html)
- [Chemistry technical document](https://nanoporetech.com/document/chemistry-technical-document)
