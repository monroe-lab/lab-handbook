---
type: protocol
title: "Flongle Sequencing and Read-Length Analysis"
---

# Flongle Sequencing and Read-Length Analysis

**Purpose:** Run a multiplexed library on a [[flongle-flow-cells-flo-flg114]] in the [[minion-mk1b]], demultiplex with Dorado, and produce per-sample read-length histograms for go/no-go decisions on PacBio HiFi shearing QC. Final step of the [[in-house-hifi-shearing-pipeline]].

**Source:** Oxford Nanopore [Flongle quick start](https://store.nanoporetech.com/us/flongle-starter-pack-2.html), MinKNOW documentation (Nanopore community portal), and the [Dorado](https://github.com/nanoporetech/dorado) and [NanoPlot](https://github.com/wdecoster/NanoPlot) docs.

## Background

A nanopore read length equals the actual physical length of the molecule that translocated through the pore. There is no inference, no electrophoretic mobility curve, no calibration ladder. Dump a barcoded pool from [[flongle-rapid-barcoding-rbk114]] onto a Flongle, run for an hour, demultiplex by barcode, and the resulting per-sample read-length histogram **is** the size distribution of the input library. This is more honest than a FemtoPulse trace, and same-day.

## One-time setup

Skip this section after the first run.

### Hardware
1. Plug the [[minion-mk1b]] into the lab laptop via USB-C.
2. Snap the [[flongle-starter-pack]] adapter into the MinION (replaces the standard MinION flow cell socket). Leave it in.
3. Confirm the laptop has at least 100 GB free disk and a recent NVIDIA GPU if you want live basecalling — Flongle data is small (~1-2 GB per run) but Dorado is GPU-accelerated.

### Software
1. Create an Oxford Nanopore community account at <https://nanoporetech.com>.
2. Download and install **MinKNOW** from the community portal. This handles run control and live basecalling.
3. Install **Dorado**: <https://github.com/nanoporetech/dorado>. Download the latest release binary and add to PATH.
4. Install **NanoPlot**: `pip install nanoplot`.

## Required input

- One adapter-loaded pooled library from [[flongle-rapid-barcoding-rbk114]] § 5 (15 µL, fresh, on ice)
- One [[flongle-flow-cells-flo-flg114]] (check the expiration date — they are perishable, ~8 weeks refrigerated)

## Required materials

- [[minion-mk1b]] with the Flongle adapter installed
- [[flongle-flow-cells-flo-flg114]]
- Flongle priming buffer and library buffer from [[sqk-rbk114-24]]
- [[bovine-serum-albumin-50mg-ml]] (optional loading additive recommended by Oxford)
- [[nuclease-free-water]]
- 200 µL standard filter tips for the Flongle loading port (the bore size doesn't matter here — the library is already sheared)

## Procedure

### 1. Flow cell QC

1. Insert the [[flongle-flow-cells-flo-flg114]] into the adapter on the [[minion-mk1b]].
2. In MinKNOW, run a **Flow Cell Check**.
3. Read the active pore count. Oxford's warranty threshold for Flongles is **≥50 active pores**. If your flow cell is below this:
   - **Stop**. Do not load the library.
   - Take a screenshot of the flow cell ID and pore count.
   - Email Oxford support (`support@nanoporetech.com`) with the flow cell serial and screenshot. They will replace it.
   - Don't waste a library prep on a dead flow cell.
4. If pore count is acceptable, proceed.

### 2. Prime the Flongle

Follow the SQK-RBK114 protocol section for Flongle loading exactly:

1. Open the Flongle's sample port cover.
2. Pipette **120 µL** of priming mix (Flush Buffer + Flush Tether per the kit instructions, optionally add 0.5 µL [[bovine-serum-albumin-50mg-ml]]) **slowly** into the priming port.
3. **Avoid bubbles.** A bubble in the channel kills pores. Watch the meniscus.

### 3. Load the library

1. Mix the adapter-loaded pool (15 µL) with the Sequencing Buffer and Library Beads from [[sqk-rbk114-24]] per the kit instructions. Final volume ~30 µL.
2. **Slowly** pipette ~30 µL of the library mix into the **sample port** of the Flongle. Use a single steady motion. No bubbles.
3. Close the sample port cover.

### 4. Start the run

1. In MinKNOW, set up a new experiment:
   - Kit: **SQK-RBK114.24**
   - Flow cell: **FLO-FLG114**
   - Run length: **2 hours** (1 hour is often enough for QC; 4 hours if pores are weak)
   - Basecalling: **on**, with the live basecaller
   - Barcoding: **on**, with the SQK-RBK114.24 barcode set
2. Start. Monitor the live read-length histogram in MinKNOW for the first 5-10 min — you should see reads accumulating with a peak in the 10-25 kb range. If the peak is much smaller (<5 kb) something went wrong upstream.

### 5. Demultiplex with Dorado

After the run finishes, MinKNOW writes basecalled FASTQ to its output directory. To re-demultiplex (or for higher accuracy than the live basecaller):

```bash
# basecall (skip if MinKNOW already did this)
dorado basecaller hac /path/to/pod5/ > basecalled.bam

# demultiplex with the SQK-RBK114.24 kit
dorado demux \
  --kit-name SQK-RBK114-24 \
  --output-dir demux_out/ \
  basecalled.bam
```

This produces one BAM file per barcode in `demux_out/`. Convert to FASTQ if your downstream tools want it:

```bash
for bam in demux_out/*.bam; do
  samtools fastq "$bam" > "${bam%.bam}.fastq"
done
```

### 6. Read-length histograms with NanoPlot

```bash
for fq in demux_out/*.fastq; do
  sample=$(basename "$fq" .fastq)
  NanoPlot --fastq "$fq" -o nanoplot_${sample}/ --title "$sample"
done
```

Each `nanoplot_*` directory has a `LengthvsQualityScatterPlot_dot.png` and a read-length histogram. Open them all and compare.

## Interpreting the histograms

A **good** sample looks like:
- Single peak in the **15-20 kb** range
- N50 close to the mean (narrow distribution)
- Tail extending to ~25-30 kb but no significant mass above 30 kb
- Negligible mass below 5 kb

A **bad** sample looks like:
- Broad smear from 1 kb to 40+ kb (not sheared enough, or pre-sheared input)
- Peak below 10 kb (over-sheared, or transposase tagging extended too long)
- Bimodal distribution (mixed input or tagging artifact)
- Mass concentrated below 3 kb (catastrophic over-shearing — usually a wrong-tip or wrong-Qubit incident)

## Decision rule (per sample)

| Metric | Pass | Fail |
| --- | --- | --- |
| Mean read length | 13-22 kb (after applying calibration offset from [[in-house-hifi-shearing]] § Validation Phase) | <13 kb or >25 kb |
| N50 | within 20% of mean | wider |
| Mass below 5 kb | <10% | ≥10% |
| Mass above 30 kb | <5% | ≥5% |
| Distribution shape | unimodal | bimodal or smear |

**Pass:** proceed to [[pacbio-hifi-sequencing]] SMRTbell prep.
**Fail:** re-shear from the frozen aliquot (see [[ot2-hmw-shearing]] § Troubleshooting), or send the sample to the Genome Center per [[in-house-vs-genome-center-decision]].

## Cleaning up the Flongle

### Single-use (default)
1. After the run, eject the Flongle from the adapter.
2. Discard in regular biohazard waste.

### Optional reuse with Flow Cell Wash Kit
If the post-run pore count is still healthy and you want to reuse the flow cell:

1. Use [[flow-cell-wash-kit-exp-wsh004]] per Oxford's protocol.
2. Re-check pore count after wash. If still ≥50, store at 4 °C and reuse within a few days.
3. Note: reused Flongles often give lower yields. Only worth it if pore count was high after the first run.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Pore count below 50 at start | Flow cell expired or damaged in transit | Email Oxford for replacement; do not load library |
| Pore count crashes during run | Bubbles, contamination, or library too concentrated | Restart with cleaner prep |
| All reads in one barcode | Wrong demux kit specified | Re-run `dorado demux` with `SQK-RBK114-24` |
| All reads <2 kb | Over-shearing upstream or tagging extended | Check [[ot2-hmw-shearing]] and [[flongle-rapid-barcoding-rbk114]] for protocol violations |
| Big "unclassified" bin | Adapter ligation failed or input too low | Increase input to 75 ng/sample next time |
| Fewer reads than expected | Low input, dead pores, or aspirated air during loading | Live with it for QC; histogram is still readable down to ~1000 reads/sample |

## Safety

Standard BSL1. Nothing in the Flongle workflow is hazardous.

## See also

- [[flongle-rapid-barcoding-rbk114]]
- [[ot2-hmw-shearing]]
- [[in-house-hifi-shearing-pipeline]]
- [[in-house-vs-genome-center-decision]]
- [Dorado on GitHub](https://github.com/nanoporetech/dorado)
- [NanoPlot on GitHub](https://github.com/wdecoster/NanoPlot)
