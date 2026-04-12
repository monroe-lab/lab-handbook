---
type: protocol
title: "Loading and Running a MinION Flow Cell"
---

# Loading and Running a MinION Flow Cell

## Resources

**Equipment:** [[minion-mk1b|Oxford Nanopore MinION device]], [[minion-flow-cell|MinION flow cell]] (R10.4.1 or current version), computer with MinKNOW software installed

**Reagents:** Sequencing library (from [[nanopore-rapid-library-prep]]), Flow Cell Flush (FCF), Flow Cell Tether (FCT), [[nuclease-free-water]]

**Related Protocols:** [[nanopore-rapid-library-prep]], [[nanopore-data-retrieval]]

**Prerequisites:** A prepared sequencing library

**Purpose:** Load your library onto a MinION flow cell, start a sequencing run, and monitor it. This is where your DNA gets read.

## Time estimate

**Wall time:** ~1-1.5 hr setup + 12-72 hr run | **Hands-on:** ~30 min

---

## Before You Start

- **[[minion-mk1b|MinION device]]** connected to the computer via USB, powered on.
- **MinKNOW software** installed and updated to the latest version.
- **[[minion-flow-cell|Flow cell]]** at room temperature (remove from [[fridge-4c-main|4C storage]] at least 10 minutes before use).
- **Library** prepared and ready (do not freeze; load within 1-2 hours of preparation).

**Equipment needed but not yet in the lab:** MinION device, flow cells, and computer setup need to be purchased and configured. See Grey for the ordering plan.

## Background

The MinION is a portable sequencing device. A flow cell contains an array of nanopores (protein channels embedded in an electrical membrane). When DNA passes through a nanopore, it disrupts the ionic current in a characteristic way for each base. MinKNOW software reads the current signal and converts it to DNA sequence in real time (basecalling).

**Flow cell capacity:** A single MinION flow cell (R10.4.1) can produce 10-50 Gb of sequence data over a 72-hour run, depending on the number of active pores and library quality. For an Arabidopsis genome (~135 Mb), even a modest run produces 30-100x coverage.

## Videos

- [How Nanopore Sequencing Works (Oxford Nanopore Technologies)](https://youtu.be/RcP85JHLmnI) — Animated overview of the nanopore sequencing mechanism
- [Loading a Nanopore Flow Cell (Oxford Nanopore Technologies)](https://www.youtube.com/watch?v=Pt-iaemrM88) — Official tutorial on flow cell loading procedure
- [Getting Started with MinION (Oxford Nanopore)](https://nanoporetech.com/getting-started-with-minion) — Oxford Nanopore's MinION onboarding and setup guide

## Procedure

### 1. Flow cell QC

1. Insert the [[minion-flow-cell|flow cell]] into the [[minion-mk1b|MinION device]].
2. In MinKNOW, run a **flow cell check** (Platform QC). This takes ~5 minutes.
3. The check reports the number of **active pores**. A new flow cell should have >800 active pores. If significantly less, the flow cell may be old or damaged.
4. Record the pore count.

### 2. Prime the flow cell

1. Prepare the **priming mix**: combine Flow Cell Flush (FCF) with Flow Cell Tether (FCT) according to the kit instructions.
2. Open the priming port on the flow cell (the small port, not the sample port).
3. Using a [[micropipette-p1000|P1000]] pipette, slowly load the priming mix into the priming port. **Go very slowly** to avoid introducing air bubbles. Air bubbles can block pores.
4. Wait **5 minutes** for the priming mix to flow across the array.
5. Add a second priming aliquot if specified by the kit protocol.

### 3. Load the library

1. Prepare the **loading mix**: combine your library with the remaining priming/loading reagents as specified in the kit protocol.
2. Open the **sample port** (the larger port on the flow cell).
3. Using a [[micropipette-p200|P200]] pipette, **slowly** add the loading mix to the sample port. Drip it in. **Do not push air into the port.**
4. Close the sample port.
5. Close the priming port.

### 4. Start the run

1. In MinKNOW, click **Start Sequencing** (or "Start Run").
2. Configure:
   - **Experiment name:** Use a descriptive name (e.g., `SALK045678_GM_2026-04-15`)
   - **Kit selection:** Choose the kit you used (e.g., SQK-RAD114)
   - **Basecalling:** Enable real-time basecalling (SUP model for best accuracy, or HAC for faster)
   - **Run duration:** Set to 48-72 hours (you can stop early if you have enough data)
   - **Output format:** POD5 (raw signal) + FASTQ (basecalled sequences)
3. Click start.

### 5. Monitor the run

MinKNOW shows real-time metrics:

| Metric | What it means | What to watch for |
|--------|--------------|-------------------|
| Pore activity | How many pores are actively sequencing | Should be >50% of available pores at the start. Declines over time (normal). |
| Read count | Total number of reads generated | Should increase steadily |
| Bases called | Total bases sequenced (Gb) | For Arabidopsis: 5 Gb = ~37x coverage, 10 Gb = ~74x |
| N50 read length | Median read length (weighted by bases) | Depends on input DNA quality. >10 kb is good for HMW. |
| Quality score | Mean basecall quality | Q10+ is acceptable, Q15+ is good with SUP basecalling |

Check the run every few hours during the first day. After that, it largely runs itself.

### 6. Stop the run

- Click **Stop Sequencing** in MinKNOW when you have enough data, or let it run to completion.
- For a full Arabidopsis genome assembly: aim for at least **20-30x coverage** (~3-4 Gb).
- More is better (50-100x enables better polishing), but a single flow cell typically provides plenty.

## After the Run

- Proceed to [[nanopore-data-retrieval]] for data management.
- The flow cell can sometimes be washed and reused (Oxford Nanopore provides a wash kit). Ask Grey about the lab's policy on flow cell reuse.

## Troubleshooting

| Problem | Possible cause | Solution |
|---------|---------------|----------|
| Very few active pores on QC | Old or damaged flow cell | Use a different flow cell. Check storage conditions. |
| Pore occupancy drops immediately | Air bubble in the flow cell | Reflush. Be more careful loading next time. |
| Very short reads | DNA was fragmented before/during library prep | Check HMW extraction quality. Handle DNA gently. |
| No basecalling output | Basecalling not enabled, or GPU not available | Check MinKNOW settings. SUP model requires GPU. |
| Run crashes | Computer issue | Ensure the computer stays powered on and doesn't sleep |

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Note:

- Flow cell ID and pore count (from QC)
- Library loaded (genotype, prep date, input ng)
- Run parameters (duration, basecalling model)
- Final metrics: total bases, read count, N50, mean quality
- Output file locations (see [[nanopore-data-retrieval]])
