---
type: protocol
title: "Illumina Library QC on a Flongle (Stretch Use Case)"
---

# Illumina Library QC on a Flongle (Stretch Use Case)

**Purpose:** Read every molecule of an Illumina short-read library end-to-end on a Flongle as a **pre-flight QC before a $1,400–5,000 NovaSeq/MiSeq run**. Not a replacement for TapeStation, KAPA qPCR, or the actual Illumina run — a same-day sanity check.

**Status: stretch use case, not the primary pipeline capability.** The primary capability is HiFi shearing QC (see [[in-house-hifi-shearing-pipeline]]). This variant uses the **same hardware and the same [[sqk-nbd114-24]] kit** but differs in AMPure ratio, expected read counts, and interpretation.

## What this can tell you

- **Real insert size distribution** (not inferred from paired-end overlap)
- **Adapter dimer fraction** (catches failed cleanups)
- **Library complexity** (catches over-amplified or low-complexity libraries)
- **Sequence content sanity check** (catches contamination, mix-ups, wrong samples)
- **Per-molecule i5/i7 barcode readout** (if the library is already dual-indexed — note that the sample goes through a second round of ONT native barcoding on top of its Illumina indices)

## What it cannot tell you

- Absolute concentration (Flongle is not quantitative in the way a TapeStation + KAPA workflow is — keep those)
- Base-level quality on the Illumina platform (different chemistry, different error profile)
- Clustering behavior on a flow cell

## The three catches (read before running)

### Catch 1: AMPure ratio must be 1.8× (NOT the default 0.6×)

A typical Illumina library has ~150–500 bp inserts plus ~120 bp of P5/P7 adapters = **~270–620 bp total molecule length**. The default HMW-tuned NBD114.24 cleanup uses **0.6× AMPure XP**, which cuts at ~1 kb and would **discard the shortest inserts** and bias the histogram long.

**For Illumina library QC, every AMPure cleanup in the NBD114.24 workflow must be raised to 1.8× AMPure XP.** 1.8× retains fragments down to ~100 bp, preserving the real insert-size distribution.

> **Do not reuse the HMW-tuned protocol with a different bead ratio.** Write this as a **separate Python protocol file** (different `.py`, different deck layout if needed) or run it manually from [[nbd114-multiplexed-flongle-prep]] with the ratios overridden at every cleanup step. Cross-contaminating ratios between use cases silently breaks every downstream calibration.

### Catch 2: Read count vs. read length tradeoff

Nanopore throughput is limited by **pore-time, not base count**. Each pore reads one molecule at ~400 bp/sec. A 20 kb molecule occupies a pore ~50 sec; a 400 bp Illumina insert occupies it ~1 sec. So short-fragment runs produce **far more reads, far fewer total bases**: a Flongle on an Illumina library can produce **1–3 million reads** vs ~100,000 HMW reads on the same flow cell.

For library QC this is **good** — you want lots of independent observations of the size distribution and sequence content, not deep coverage of any position. A few hundred thousand reads is already overkill for characterizing a library.

### Catch 3: Not a replacement for TapeStation or KAPA

This use case is a **pre-flight sanity check**, not a replacement for:

- **TapeStation / Bioanalyzer** — still needed for calibrated concentration and size
- **qPCR-based library quant (KAPA)** — more accurate concentration than Flongle can provide
- **The actual Illumina run** — different chemistry, different error profile, different read structure

Frame your use accordingly. The value is catching **qualitative** failures cheaply (adapter dimers, mixed-up samples, wildly off insert size, contamination) before committing to an expensive sequencing run.

## Required input

- 100–200 ng of each Illumina library (post-bead cleanup, post-quant)
- Up to 24 libraries per Flongle run
- Concentrations verified by Qubit HS

## Procedure

Follow [[nbd114-multiplexed-flongle-prep]] **with every AMPure XP step raised to 1.8×** (instead of the 0.6× default), and every wash in final cleanup using **Short Fragment Buffer (SFB)** from [[sqk-nbd114-24]] (NOT Long Fragment Buffer — SFB retains short fragments).

Key deltas vs the HMW-tuned manual protocol:

| Step | HMW-tuned default | Illumina QC variant |
|---|---|---|
| AMPure cleanup #1 (post end-prep) | 0.6× | **1.8×** |
| AMPure cleanup #2 (post pool) | 0.6× | **1.8×** |
| AMPure cleanup #3 (final library) | 0.6×, LFB wash | **1.8×, SFB wash** |
| Target run time on Flongle | 2 hr | **1 hr** (pores cycle faster on short molecules) |
| Expected reads per sample | ~5–50k | **~50–500k** |

Then follow [[flongle-sequencing-and-analysis]] for the run, demultiplexing (use SQK-NBD114-24 kit name in Dorado), and NanoPlot histograms. Interpret the per-sample histogram as the **insert-size distribution** of the library (expect a single peak in the ~200–600 bp range for a typical Illumina prep, with adapter dimers appearing as a sharp peak near ~120 bp).

## See also

- [[nbd114-multiplexed-flongle-prep]] — the HMW-default manual NBD114.24 prep (0.6× AMPure)
- [[ot2-automated-nbd114-prep]] — HMW-default automated version
- [[flongle-sequencing-and-analysis]]
- [[in-house-hifi-shearing-pipeline]]
- [[sqk-nbd114-24]]
