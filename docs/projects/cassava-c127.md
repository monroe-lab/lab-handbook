---
type: "project"
title: "Cassava C127"
status: "active"
pi: "Grey Monroe"
lead: "Kehan Zhao"
last_updated: "2026-04-29"
---

# Cassava C127

Deep whole-genome sequencing of the C127 clonal cluster of cassava (*Manihot esculenta*), a multi-country lineage of farmer-adopted landraces from CIAT's germplasm bank. Goal: characterize somatic mutation accumulation across decades of clonal propagation and tissue culture, and look for variation associated with local adaptation.

## Summary

C127 is a cluster of genetically redundant (clonal) cassava accessions identified by Monica Carvajal's team at CIAT through GBS-based assessment of the cassava genebank. What makes the cluster scientifically interesting is its geographic breadth: the same clone is known as "Valencia" in Costa Rica and is grown under different names in Thailand and Brazil. Acquisition dates of CIAT accessions in the cluster span 1969-2012, meaning decades of independent clonal propagation history.

This project is the next-generation extension of the [[Cassava Landraces (New Phytologist 2026)|Cassava Landraces]] paper. Where the published work characterized landrace diversity, C127 zooms in on a single clonal lineage to ask: how stable is a cassava genotype across decades of vegetative propagation and tissue culture, and do somatic mutations accumulating along different geographic branches carry signatures of local adaptation?

The plan is Illumina WGS on ~41 accessions plus PacBio HiFi on 10 representative accessions, with at least one in vitro plantlet shipped to UC Davis for reference assembly. Tissue is being collected at CIAT in Colombia; shipment is pending the US import permit and an SMTA (coordinated by Monica Velez at CIAT). As of 2026-04-28, 43 of 50 target accessions have ~150 mg lyophilized leaf tissue ready, and Monica is using their published 2024 extraction protocol.

This project is also the working substrate for incoming postdoc Amit Cucuy (BARD fellowship, expected start fall 2026), whose research focus on intra-organismal somatic variation in clonally propagated plants aligns directly with the C127 questions.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Kehan Zhao]]
- External collaborators (plain text):
  - Monica Carvajal (Alliance Bioversity-CIAT, Colombia) — C127 cluster identification, sample selection, DNA extraction
  - Paul Chavarriaga (CIAT) — CIAT-side co-PI, gene editing, field coordination
  - Francisco Sanchez (CIAT) — DNA extractions, sample shipment
  - Monica Velez (CIAT) — SMTA coordination
  - Amit Cucuy (Weizmann Institute / incoming UC Davis postdoc, fall 2026) — C127 likely a major component of his postdoc work
  - Norma and Peter (CIAT genebank curators) — cluster selection
  - Evan Long (USDA-ARS, Kimberly ID) — assemblies, possible contributor

## Sequenced samples

Samples not yet received as of 2026-04-29. All 51 accession cards are filed under status `waiting`, with the note "Not yet received — Samples at CIAT, Colombia."

| Sequencing | Accessions | IDs |
| --- | --- | --- |
| Illumina WGS | 41 | C127_1 through C127_41 |
| PacBio HiFi | 10 | C127_1_hifi through C127_10_hifi |

Filter the [accession index](../accessions/index.md) by `project: "Cassava C127"` for the live list.

## Resources

- [[Kehan Zhao]] · [[Grey Monroe]]
- Sibling project: [[cassava-landraces-new-phytologist|Cassava Landraces (New Phytologist 2026)]]
- C127 cluster proposal (Monica Carvajal, Feb 2026): [Google Doc](https://docs.google.com/document/d/1Ctwr02JKkNhsmypxFea0K2EYDTKbWSB6VpRqbPpi74o)
- Master sample tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI/edit)
- CIAT cassava landraces base data (published Mar 2026): [cassavabase.org protocol #64](https://cassavabase.org/breeders_toolbox/protocol/64)
- Public landrace VCF / SRA: [NCBI BioProject PRJNA1228154](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1228154)

## Open questions

- Whether to add a second contrasting (geographically concentrated) clonal cluster alongside C127, as Monica offered.
- Which in vitro plantlet to ship for the reference assembly (COL200 is the current preferred candidate).
- Status of the FFAR Landrace Thermotolerance grant remaining funds (this project's primary funding source).

## Related

- [[cassava-landraces-new-phytologist]]
- [[mutation-accumulation]]

#project #cassava #manihot #somatic-mutation #clonal #c127 #ciat #ffar #active
