---
type: project
title: "In-House Flongle Diagnostic Pipeline"
status: "active"
pi: "Grey Monroe"
---

# In-House Flongle Diagnostic Pipeline

Build a fast, cheap, same-day in-house diagnostic pipeline using the lab's [[opentrons-ot2]] and a new Oxford Nanopore [[minion-mk1b]] + Flongle setup. **The Flongle is the lab's "look at any tube of dsDNA before you spend real money on it" tool.** It complements, and does not replace, the [[uc-davis-dna-technologies-core]] for production sequencing.

The original driver is PacBio HiFi shearing QC, but the same hardware and the same [[sqk-nbd114-24]] kit unlock a long list of adjacent use cases.

## Motivation

The lab currently outsources HMW DNA shearing (CybioFelix, $70/batch) and size QC (FemtoPulse, $27/sample) to the [[uc-davis-dna-technologies-core]]. This is a single-person dependency on Noravit Chumchim and routinely costs us 1-2 weeks of queue time per batch. Recent specific pain:

- **PB1361 pistachio batch**: 4 of 5 samples oversheared due to a concentration normalization mismatch (the lab Qubit reads ~half of the Genome Center Qubit). Samples had to be re-diluted and resubmitted as PB1365, losing ~10 days.
- **April-May 2026 leave**: Noravit out 2026-04-09 to early May. The HiFi pipeline is blocked the entire window unless we have an in-house screening path.

The shearing physics are not proprietary. Sanger Tree of Life publishes a validated [OT-2 pipette shearing protocol targeting 12-22 kb](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-g9cwbz2xf.html) for PacBio long-insert work. For size QC, a nanopore read length equals the actual molecule length, so a Flongle on a small aliquot of sheared DNA gives a direct read-length histogram — **provided the library prep is ligation-based**. We use [[sqk-nbd114-24]] (Native Barcoding Kit V14), 24-plex, ~$10–30/sample.

## Kit correction (important)

The original project briefing recommended SQK-RBK114.24 (Rapid Barcoding Kit). **That was wrong.** The rapid kit uses transposase tagmentation which cuts the DNA during prep — output read length reflects the transposase, not the input. The **correct** kit is SQK-NBD114.24 (Native Barcoding Kit V14), which is ligation-based and preserves molecule length. See [[sqk-nbd114-24]] and [[in-house-hifi-shearing-pipeline]] § What this pipeline is for the full comparison.

## Layered vision: use cases in priority order

1. **Primary: PacBio HiFi shearing QC** — confirm the OT-2-sheared HMW DNA hit 15–20 kb before committing to a $300+ SMRTbell prep and a $1,400–2,000 Revio cell.
2. **Pre-flight QC of any HiFi library** before it ships to the Genome Center. Catches library-prep failures before they consume a Revio cell.
3. **Pre-flight QC of native HMW gDNA** before extraction is committed to library prep.
4. **Plasmid verification** — full sequence of up to 24 plasmids per run. Replaces Sanger walks.
5. **PCR amplicon and T-DNA insertion verification.** Full end-to-end molecule confirmation Sanger cannot provide.
6. **Accession / variety / cultivar ID** via low-coverage skim sequencing.
7. **Methylation screening** — 5mC/5hmC/6mA for free on every nanopore run via Dorado modbase models.
8. **Pilot / development platform for Fiber-seq.**
9. **Stretch: Illumina library QC** — see [[illumina-library-qc-on-flongle]]. Requires 1.8× AMPure instead of the 0.6× default.

All nine share the same [[sqk-nbd114-24]] kit and the same MinION + Flongle hardware. They differ mainly in AMPure bead ratio, run time, and histogram interpretation.

## Goals

1. Shear HMW DNA to 15–20 kb mean, narrow distribution within 10–30 kb, no significant >25 kb tail.
2. QC every batch same-day before SMRTbell library prep.
3. Reduce the routine Genome Center dependency for screening, while keeping them as the production sequencer.
4. Per-sample QC cost competitive with $27/sample at the Genome Center.
5. Reproducible enough that any lab member (not just Vianney) can run it.
6. OT-2 automation as the default — hands-on time ~30–45 min, wall-clock ~5–7 hr.

## Status

Planning and procurement. Workflow is documented but **not yet validated** — see [[validation-plan]]. Until calibration against FemtoPulse is logged, treat all in-house results as provisional and continue parallel FemtoPulse on critical batches.

## Sub-pages

- [[bill-of-materials]] — equipment, kits, consumables
- [[validation-plan]] — calibration against FemtoPulse

## Key Protocols

- [[in-house-hifi-shearing-pipeline]] — master pipeline page with diagram, use cases, and decision rules
- [[operating-the-ot2]] — general OT-2 operations (foundational)
- [[ot2-hmw-shearing]] — Sanger ToL pipette shearing protocol adapted for the lab
- [[ot2-automated-nbd114-prep]] — **default production** library prep (chained OT-2 Python protocol)
- [[nbd114-multiplexed-flongle-prep]] — manual fallback library prep
- [[illumina-library-qc-on-flongle]] — stretch use case (1.8× AMPure variant)
- [[flongle-sequencing-and-analysis]] — MinION/Flongle run, Dorado demux, NanoPlot, go/no-go
- [[in-house-vs-genome-center-decision]] — when to use which path
- [[pacbio-hifi-sequencing]] — downstream SMRTbell library prep at the Genome Center

## Related

- [[pistachio-pangenome]]
- [[alfalfa-pangenome]]
- [[pacbio-hifi-sequencing]]
