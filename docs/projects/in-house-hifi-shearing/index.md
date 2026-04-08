---
type: project
title: "In-House HiFi Shearing and QC"
status: "active"
pi: "Grey Monroe"
---

# In-House HiFi Shearing and QC

Bring PacBio HiFi DNA shearing and size QC in-house using the lab's [[opentrons-ot2]] and a new Oxford Nanopore [[minion-mk1b]] + Flongle setup, removing the lab's dependency on the UC Davis DNA Technologies Core for routine HiFi prep.

## Motivation

The lab currently outsources HMW DNA shearing (CybioFelix, $70/batch) and size QC (FemtoPulse, $27/sample) to the [[uc-davis-dna-technologies-core]]. This is a single-person dependency on Noravit Chumchim and routinely costs us 1-2 weeks of queue time per batch. Recent specific pain:

- **PB1361 pistachio batch**: 4 of 5 samples oversheared due to a concentration normalization mismatch (the lab Qubit reads ~half of the Genome Center Qubit). Samples had to be re-diluted and resubmitted as PB1365, losing ~10 days.
- **April-May 2026 leave**: Noravit out 2026-04-09 to early May. The HiFi pipeline is blocked the entire window unless we have an in-house path.

The shearing physics are not proprietary. Sanger Tree of Life publishes a validated [OT-2 pipette shearing protocol targeting 12-22 kb](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-g9cwbz2xf.html) for PacBio long-insert work, and PacBio explicitly endorses pipette shearing on third-party liquid handlers.

For size QC, instead of buying a [[femtopulse]] (~$100k+) or [TapeStation](https://www.agilent.com/en/product/automated-electrophoresis/tapestation-systems) (~$30k, soft above 15 kb), we use **Oxford Nanopore Flongle rapid runs**: a nanopore read length equals the actual molecule length, so a Flongle on a small aliquot of sheared DNA gives a direct read-length histogram. With [[sqk-rbk114-24]] we multiplex up to 24 samples per Flongle, hitting $10-29/sample with same-day turnaround.

## Goals

1. Shear HMW DNA to a 15-20 kb mean, narrow distribution within 10-30 kb, no significant >25 kb tail.
2. QC every batch before SMRTbell library prep, same-day.
3. Eliminate the routine Genome Center dependency for shearing and size QC.
4. Per-sample QC cost competitive with $27/sample at the Genome Center.
5. Reproducible enough that any lab member (not just Vianney) can run it.

## Status

Planning and procurement. Workflow is documented but **not yet validated** — see [[validation-plan]]. Until calibration is logged, treat all in-house results as provisional and continue parallel FemtoPulse on critical batches.

## Sub-pages

- [[bill-of-materials]] — equipment, kits, consumables
- [[validation-plan]] — calibration against FemtoPulse

## Key Protocols

- [[in-house-hifi-shearing-pipeline]] — master pipeline page with mermaid diagram and decision rules
- [[operating-the-ot2]] — general OT-2 operations (foundational)
- [[ot2-hmw-shearing]] — Sanger ToL pipette shearing protocol adapted for the lab
- [[flongle-rapid-barcoding-rbk114]] — SQK-RBK114.24 multiplexed library prep
- [[flongle-sequencing-and-analysis]] — MinION/Flongle run, Dorado demux, NanoPlot, go/no-go
- [[in-house-vs-genome-center-decision]] — when to use which path
- [[pacbio-hifi-sequencing]] — downstream SMRTbell library prep

## Related

- [[pistachio-pangenome]]
- [[alfalfa-pangenome]]
- [[pacbio-hifi-sequencing]]
