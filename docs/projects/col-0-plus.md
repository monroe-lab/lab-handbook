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
