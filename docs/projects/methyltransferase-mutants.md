---
type: "project"
title: "Methyltransferase Mutants"
status: "active"
pi: "Grey Monroe"
lead: "Percival Singson"
last_updated: "2026-04-29"
---

# Methyltransferase Mutants

PacBio HiFi sequencing of *Arabidopsis thaliana* methyltransferase / chromatin-pathway mutant lines (CS72761 batch). Connects mutation-rate biology to the lab's epigenomic work and supports related paraquat-mutator / MSH6 experiments by [[Satoyo Oya]] and [[Jiani Li]].

## Summary

This project is the sequencing arm for [[Percival Singson]]'s methyltransferase mutant work. The accession card is filed as a single batch (`CS72761 (batch)`), reflecting the way the line was acquired and how the QC sheet is organized. As of 2025-10-07 the DNA was extracted and QC values (Qubit, Nanodrop, broad-range Qubit) were recorded for ~50 rows on the project's Google Sheet.

Two adjacent projects share material and methodology: Satoyo's [[dna-repair-mutant-mutation-spectra|DNA Repair Mutant Mutation Spectra]] and her MSH6 paraquat HiFi sequencing work with [[Jiani Li]]. Wenfei's somatic SNV calling pipeline (discussed at PAG 2026) is the planned analysis tool — much more accurate than Himut for revealing the Arabidopsis mutation signature without needing a "background mutation signature" subtraction step.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Percival Singson]] (extractions; mentored on protocol by [[Vianney Ahn]])
- Adjacent work: [[Satoyo Oya]], [[Jiani Li]] (MSH6 / paraquat-mutator HiFi pipeline)

## Sequenced samples

One concept-level batch accession is filed: `CS72761 (batch)`. Per-line cards should be split out as the project proceeds. Filter the [accession index](../accessions/index.md) by `project: "Methyltransferase Mutants"`.

| Sequencing | Count | Status |
| --- | --- | --- |
| PacBio HiFi | 1 (batch placeholder) | Active — DNA extracted, QC data in tracking sheet |

## Resources

- [[Percival Singson]] · [[Vianney Ahn]] · [[Satoyo Oya]] · [[Jiani Li]]
- CS72761 sequencing / DNA extraction / libraries QC sheet: [Google Sheet](https://docs.google.com/spreadsheets/d/18ymHE9XJJbDWru7pgwtYOdLT879aedtSVajSTCjRyuw)
- Reference: [[Col-CC Reference Genome]] / TAIR10
- Protocols: [[hifi-dna-extraction]], [[quantifying-dna-nanodrop]], [[quantifying-dna-qubit]]

## Open questions

- Per-mutant breakdown: which methyltransferase / chromatin loci are represented in CS72761 (MET1? CMT3? DDM1? a multi-mutant?).
- Whether sequencing will use PacBio HiFi (current `sequencing_type` field) or a mix of HiFi + Illumina.

## Related

- [[dna-repair-mutant-mutation-spectra]]
- [[col-0-plus]]
- [[mutation-accumulation]]

#project #arabidopsis #methyltransferase #chromatin #hifi #active
