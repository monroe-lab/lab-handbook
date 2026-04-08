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

Planning and procurement. Workflow is documented but **not yet validated** — see Validation phase below. Until calibration is logged, treat all in-house results as provisional and continue parallel FemtoPulse on critical batches.

## Key Documents

- [[in-house-hifi-shearing-pipeline]] — master pipeline page with mermaid diagram and decision rules
- [[operating-the-ot2]] — general OT-2 operations (foundational)
- [[ot2-hmw-shearing]] — Sanger ToL pipette shearing protocol adapted for the lab
- [[flongle-rapid-barcoding-rbk114]] — SQK-RBK114.24 multiplexed library prep
- [[flongle-sequencing-and-analysis]] — MinION/Flongle run, Dorado demux, NanoPlot, go/no-go
- [[in-house-vs-genome-center-decision]] — when to use which path
- [[pacbio-hifi-sequencing]] — downstream SMRTbell library prep

## Validation Phase (prerequisite to production use)

Before this workflow goes into production we run **one calibration batch** against the FemtoPulse to characterize bias from the AMPure cleanup + Flongle path:

1. Take one batch of 8-12 HMW DNA samples.
2. Shear all on the OT-2 using [[ot2-hmw-shearing]].
3. Split each sample into two aliquots:
   - **Aliquot A**: Genome Center FemtoPulse (~$27/sample). Requires Noravit back from leave (~early May 2026).
   - **Aliquot B**: in-house Flongle path ([[flongle-rapid-barcoding-rbk114]] then [[flongle-sequencing-and-analysis]]).
4. Compare per-sample read-length distributions.
5. Log the offset (e.g., "Flongle reads X% shorter mean and Y% narrower than FemtoPulse on the same input") in the master pipeline page as a constant correction factor.
6. The validation must use the **same AMPure beads, ratio, and protocol** that production will use. Any change invalidates the calibration.

Once logged, the in-house workflow is cleared for production.

## Bill of Materials

### Already owned (verify)

- [[opentrons-ot2]] (delivered 2020-09)
- [[ot2-temperature-module]] (GEN2)
- [[ot2-magnetic-module]] (GEN2)
- [[ot2-thermocycler-module]]
- [[qubit-fluorometer]]
- [[qubit-dsdna-hs-assay-kit]]
- [[qubit-assay-tubes]]
- [[ampure-xp-beads]]
- [[dna-lobind-tubes]]
- [[magnetic-rack]]

### To order — one-time hardware

- [[minion-mk1b]] (~$1,000)
- [[flongle-starter-pack]] (~$1,860, includes adapter + 12 flow cells)
- [[sqk-rbk114-24]] (~$700, 6 preps × 24 barcodes — **not** SQK-RAD114 or .96)
- [[flow-cell-wash-kit-exp-wsh004]] (~$300, optional)

### To order — consumables

- [[wide-bore-filter-tips-p200]] — **critical**, standard tips re-shear HMW DNA
- [[wide-bore-filter-tips-p1000]]
- [[kingfisher-deepwell-96-plate]]
- [[pcr-strip-tubes-0-2ml]]
- [[nuclease-free-water]]
- [[bovine-serum-albumin-50mg-ml]]
- [[flongle-flow-cells-flo-flg114]] (recurring, perishable ~8 wk)

## Related

- [[pistachio-pangenome]]
- [[alfalfa-pangenome]]
- [[pacbio-hifi-sequencing]]
