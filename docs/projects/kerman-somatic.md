---
type: "project"
title: "Kerman Somatic"
status: "active"
pi: "Grey Monroe"
lead: "Matt Davis"
last_updated: "2026-04-29"
---

# Kerman Somatic

Whole-genome sequencing of *Pistacia vera* cv Kerman trees from Wonderful Company orchards, designed to characterize somatic mutations accumulated during decades of clonal propagation in California's commercial pistachio industry. Sister project to the [[pistachio-pangenome|Pistachio Pangenome]] (which provides the haplotype-resolved Kerman reference) and the [[pistachio-wolfskill-collection|Wolfskill Collection]] (the diversity panel).

## Summary

The Kerman cultivar dominates California pistachio production. Like every commercial pistachio cultivar, every Kerman tree in the state ultimately traces back to a single individual, propagated forward by grafting. Decades of clonal propagation across millions of trees creates an opportunity: the somatic mutations distinguishing one Kerman tree from another are a phylogenetic record of how the cultivar has spread through the industry, and the mutations accumulating within trees can teach us about the rate and spectrum of pistachio somatic evolution.

This project samples Kerman trees across an orchard grid (positional codes like `A1_T1_W` encode block / tree / direction) and runs Illumina WGS on ~50 accessions plus HiFi on 5-10 of them. The sample set was scoped during the [[pistachio-pangenome|Pistachio Pangenome]] CPRB renewal cycle and Pat Brown / Erik Wilkins (Wonderful Company) coordinated tissue access. Tissue is being weighed and extracted in the Monroe Lab; T-samples (e.g., `A1_T1_W`) are the priority and P-samples (e.g., `R7_P13_N`) follow.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Matt Davis]] (project lead; in Europe Mar 31 - May 15)
- **HiFi / sequencing oversight:** [[Vianney Ahn]], [[Chaehee Lee]]
- **DNA extraction (Mar-May 2026):** [[Zi Ye]] (weighing tissue, primary extractor), [[Erik Spaulding]]
- External collaborators (plain text):
  - Patrick J Brown (UC Davis Plant Sciences) — pistachio breeder, sample sourcing
  - Erik Wilkins (Wonderful Company) — orchard access, leaf sampling
  - Ivan Bermudez — orchard sampling logistics, Wonderful Company contact
  - Louise Ferguson (UC Davis Plant Sciences) — extension, grower network

## Sequenced samples

65 accessions total, all *Pistacia vera*. T-samples are priority (terminal/tree-position), P-samples follow. As of 2026-04-29:

| Sequencing | Count | Status snapshot |
| --- | --- | --- |
| Illumina WGS | 55 | 46 DNA extracted (need clean-up); 4 ready for HMW; 4 on hold (previous extraction failed); 1 DNA extracted |
| PacBio HiFi | 10 | 9 tissue collected (need extraction); 1 DNA extracted (needs further extraction) |

Accession ID format: `<block>_<tree>_<position>` (e.g., `A1_T1_W` = block A1, tree 1, west; positions are E/W/N/S). Filter the [accession index](../accessions/index.md) by `project: "Kerman Somatic"` for the live list.

## Pipeline

1. Tissue weigh-out (Zi)
2. DNA extraction — Kerman short-read protocol or HMW/sorbitol-CTAB for HiFi. See [[hifi-dna-extraction]], [[pistachio-dna-extraction]].
3. Clean-up
4. Library prep with [[Vianney Ahn]]
5. Submit to NovoGene (short-read) or Genome Center (HiFi)

**HMW priority:** Two HMW bags in the -80 freezer. Bag 1 first; Bag 2 only with explicit confirmation from Grey, [[Chaehee Lee]], or [[Vianney Ahn]].

## Resources

- [[Matt Davis]] · [[Vianney Ahn]] · [[Zi Ye]] · [[Chaehee Lee]] · [[Erik Spaulding]]
- Kerman sample tracking doc: [Google Doc](https://docs.google.com/document/d/1OczM3x7lokk04sfGMUqjn2TAqU5SNyV33ULwk3n-QZM/edit)
- Master sample tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI/edit)
- Pistachio HiFi QC sheet: [Google Sheet](https://docs.google.com/spreadsheets/d/15UrgolI_mokQOI63vG_FZkUTp-KYBa9pXHJcCsuL4JE)
- Reference: phased Kerman ([[pistachio-pangenome|Pistachio Pangenome]]) — `Pvera_Kerman_RefGen_v1`
- Protocols: [[pistachio-dna-extraction]], [[hifi-dna-extraction]], [[pacbio-hifi-sequencing]]

## Related

- [[pistachio-pangenome]]
- [[pistachio-wolfskill-collection]]
- [[pbts]]
- [[pistachio-hybrids]]
- [[pistachio-short-read-wgs]]

#project #pistachio #pistacia-vera #kerman #somatic-mutation #clonal #wgs #hifi #active
