---
type: "project"
title: "Pistachio Hybrids"
status: "active"
pi: "Grey Monroe"
last_updated: "2026-04-29"
---

# Pistachio Hybrids

Sequencing of interspecific *Pistacia* rootstock hybrids — primarily *P. vera* × *P. integerrima* and related Endeavor lines. Companion to the [[pistachio-pangenome|Pistachio Pangenome]] effort, providing direct hybrid genotypes for graph-based haplotype reconstruction (the validation case for [[Pablo Luna Rodriguez]]'s [[Pacha]] pipeline) and for understanding ancestry-aware variation in California's commercial rootstocks.

## Summary

California pistachio sits on hybrid rootstocks. UCB-1, the dominant rootstock, is a *P. atlantica* × *P. integerrima* hybrid; clonal "VigorClone" lines and propietary Endeavor lines have emerged from the same pipeline. Phased parental assemblies for the *P. integerrima* and *P. atlantica* backgrounds are part of the [[pistachio-pangenome|Pistachio Pangenome]] super pan-genome. With those parents in hand, sequencing F1-class hybrid lines lets the lab (a) reconstruct which haplotype segments at each locus came from which parental species, and (b) validate the [[Pacha]] graph-based haplotype reconstruction method against a known-ground-truth case.

This project holds 17 accession cards spanning two ID series:

- `Endeavor_1` through `Endeavor_7` — Endeavor line hybrids (commercial rootstock material).
- `Pv_x_Pi_1` through `Pv_x_Pi_10` — *Pistacia vera* × *P. integerrima* hybrid samples.

All are listed `Not yet received` in the index. One sample (`Endeavor_1`) is queued for HiFi; the remaining 16 are short-read WGS.

## People

- **PI:** [[Grey Monroe]]
- Pangenome / pacha-side analysis: [[Chaehee Lee]] (pangenome construction), [[Pablo Luna Rodriguez]] ([[Pacha]] haplotype reconstruction), [[Matt Davis]] (assemblies)
- External collaborators (plain text):
  - Patrick J Brown (UC Davis Plant Sciences) — pistachio breeding, sample sourcing
  - Richard Michelmore (UC Davis Genome Center) — UCB1 parental HiFi data discussions
  - Louise Ferguson (UC Davis Plant Sciences) — pistachio rootstock taxonomy / extension network

## Sequenced samples

17 accessions, all *Pistacia vera* × *integerrima*, all `Not yet received` as of 2026-04-29.

| Series | Sequencing | Count |
| --- | --- | --- |
| `Endeavor_1` (HiFi) | PacBio HiFi | 1 |
| `Endeavor_2`-`Endeavor_7` | Illumina WGS | 6 |
| `Pv_x_Pi_1`-`Pv_x_Pi_10` | Illumina WGS | 10 |

Filter the [accession index](../accessions/index.md) by `project: "Pistachio Hybrids"` for the live list.

## Resources

- [[Chaehee Lee]] · [[Pablo Luna Rodriguez]] · [[Matt Davis]]
- Sibling: [[pistachio-pangenome|Pistachio Pangenome]] — phased *P. integerrima* / *P. atlantica* parental assemblies
- Sibling: [[pbts|PBTS]] — somatic-mutation arm in clonal UCB-1
- Master sample tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI/edit)
- Protocols: [[pistachio-dna-extraction]], [[hifi-dna-extraction]]

## Open questions

- Provenance of the Endeavor 1-7 lines (which nursery / breeding source).
- Whether the `Pv_x_Pi` series shares parents with UCB-1 (or is *P. vera* × *P. integerrima* directly, distinct from UCB-1's *P. atlantica* × *P. integerrima*).

## Related

- [[pistachio-pangenome]]
- [[pistachio-wolfskill-collection]]
- [[pbts]]
- [[pistachio-short-read-wgs]]

#project #pistachio #hybrid #rootstock #ucb1 #endeavor #wgs #active
