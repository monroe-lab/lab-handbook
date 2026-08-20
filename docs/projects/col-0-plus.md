---
type: "project"
title: "Col-0 Plus"
status: "completed"
pi: "Grey Monroe"
lead: "Vianney Ahn"
last_updated: "2026-04-29"
---

# Col-0 Plus

PacBio HiFi resequencing of *Arabidopsis thaliana* Col-0 reference and a small set of derivative / related strains, used as in-house haplotype controls for mutation calling and as a benchmarking dataset for Monroe Lab Arabidopsis pipelines built on the new [[Col-CC Reference Genome|Col-CC]] assembly.

## Summary

Most of the lab's Arabidopsis variant work is anchored on Col-0 (and increasingly on the community-consensus Col-CC / TAIR12 assembly). "Col-0 Plus" is a small in-house HiFi panel built by [[Vianney Ahn]]: 11 Col-0 / Col-derivative samples sequenced on PacBio HiFi, primarily to provide reference-quality reads for de novo assembly and singleton-confirmation work. The panel feeds into [[mutation-accumulation|MA Lines]] analysis, the AtPangenome69 singleton confirmation pipeline, and Izzy DeMarco's "Col-0++" T-DNA knockout sequencing menu (winter 2026 rotation).

The 11 samples in this project are tagged `VA_1`-`VA_14` (with some IDs unused). All are listed as `Complete` in the accession index.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Vianney Ahn]] (extractions and library prep)
- Other lab members involved: [[Grey Monroe]] (analysis on the [[Col-CC Reference Genome]] / [[AtPangenome69 Singleton Confirmation]] side)

## Sequenced samples

| Sequencing | Count | Status |
| --- | --- | --- |
| PacBio HiFi | 11 | All `Complete` |

Accession IDs: `VA_1`, `VA_2`, `VA_3`, `VA_7`, `VA_8`, `VA_9`, `VA_10`, `VA_11`, `VA_12`, `VA_13`, `VA_14`. Filter the [accession index](../accessions/index.md) by `project: "Col-0 Plus"` for the live list.

## HiFi sequencing run record (Oct 2025 – Jan 2026)

Moved here from the old "PacBio HiFi Sequencing (Col-0)" protocol page, which is now the generic [[pacbio-hifi-sequencing]] protocol. This is the project-specific history that page had accumulated.

**Shearing & input QC.** HMW extractions quantified with Qubit dsDNA BR; submitted to the Genome Center for pipette shearing at < 5 ng/µL in 200–500 µL, equal volumes. `VA_1` and `VA_9` showed low fragment sizes at input QC. Post-shearing distributions were uniform: means 17,474 / 20,265 / 17,389 bp, modes 18,241 / 19,201 / 19,500 bp (~22 kb mean on the first batch).

**Pool 1** (prepped 10/08/2025, HiFi plex prep kit 96): first bead cleanup was done on the 96-well shearing plate with the plate magnet — hard to see residual supernatant/ethanol, awkward centrifuge balancing; flagged as do-not-repeat. Genome Center Qubit: **11 ng/µL in 23 µL = 253 ng** — too low for sequencing + LightBench size selection.

**Pool 2** (same DNA pool, minus `VA_9` — its low-yield extraction was fully consumed by pool 1): repair step extended from 30 min to 1 hr at 37 °C per Noravit's advice. Final: **36.4 ng/µL in 25 µL ≈ 865 ng**.

**Merged pool:** Pool 1 + Pool 2 combined with SMRTbell cleanup beads at 1×, concentrated to **43.8 ng/µL in ~25 µL** (Qubit). Final pool QC: mean fragment 19,772 bp, mode 18,150 bp. Sent for LightBench size selection (< 12 kb cutoff) and sequencing. Pool 1 contributed ~23% of mass, Pool 2 ~77%.

**Demultiplexing issue (Jan 2026):** a large fraction of reads came back non-barcoded, with quality scores comparable to the barcoded reads (so not a quality artifact). Pool 1 indexes were double-checked and believed correct. Suspected cause: the lab's much-re-used 96-well adapter index plate (cross-contamination between wells), compounded by the pool-2 adapter-well record having been kept on a piece of paper that was lost and reconstructed after the fact. Lessons folded into the generic protocol: fresh index plates, digital run sheet kept current while pipetting.

- Run sheet: [Col-0 HMW gDNA extractions & libraries](https://docs.google.com/spreadsheets/d/1nWy1T0GWThBWpcfzS10ANcgUsvvXtHLdVDAryb4O0ow/edit?usp=sharing)

## Farm data layout

Project working tree: `~/projects/col0plus/` on Farm. Reference: `~/projects/col0plus/ref/Col-CC.genomic.fna` (linked to [[Col-CC Reference Genome]]).

## Resources

- [[Vianney Ahn]]
- [[Col-CC Reference Genome]] — TAIR12-bound community consensus reference
- Col-0 strain sources sheet: [Google Sheet](https://docs.google.com/spreadsheets/d/1hHzWKx18vVfwuLGOni0SOOYniGJbTK02cPozqi3MOxs)

## Related

- [[methyltransferase-mutants]]
- [[dna-repair-mutant-mutation-spectra]]
- [[mutation-accumulation]]

#project #arabidopsis #col-0 #hifi #reference #completed
