---
type: "project"
title: "DNA Repair Mutant Mutation Spectra"
status: "active"
pi: "Grey Monroe"
lead: "Satoyo Oya"
last_updated: "2026-04-29"
---

# DNA Repair Mutant Mutation Spectra

PacBio HiFi sequencing of *Arabidopsis thaliana* lines with disruptions in DNA repair / damage-response pathways, designed to characterize the mutation spectra those backgrounds produce in vivo. Companion line of work to Satoyo Oya's published Polλ heat-mutator paper and to the lab's broader mutation-bias program.

## Summary

This is the in-house mutation-spectra arm of Satoyo's postdoc work. The plan is to take a small number of repair-pathway-deficient Arabidopsis lines (X-ray exposure series + DSB repair mutants), grow them under defined conditions (including pre-irradiation controls), extract HMW DNA, and submit to NovoGene for HiFi SMRT cell sequencing. Variant calling uses Wenfei's somatic SNV pipeline (more accurate than Himut for detecting low-frequency somatic mutations against the Arabidopsis background).

Status as of Apr 2026: 3 NovoGene HiFi SMRT cells reserved (chart string in the private vault). On hold pending a library-prep kit delay (kit was at the Kliebenstein Lab; [[Vianney Ahn]] has resolved). Next steps: DNA extraction from the frozen samples, QC, shearing + post-shearing QC, library prep with [[Vianney Ahn]], submission to NovoGene. Connected to the [[methyltransferase-mutants|MSH6/methyltransferase mutant]] paraquat HiFi work (also Satoyo + [[Jiani Li]]) and to Satoyo's HFSP fellowship.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Satoyo Oya]] (postdoc, currently in Tübingen on HFSP)
- Library prep / sequencing coordination: [[Vianney Ahn]]
- Connected work: [[Jiani Li]] (paraquat treatment side)

## Sequenced samples

One concept-level accession card is filed for the sample series: `Satoyo X-ray/DSB HiFi`. Filter the [accession index](../accessions/index.md) by `project: "DNA Repair Mutant Mutation Spectra"`. Treat this as a placeholder; per-line accession cards should be split out as samples enter the pipeline.

| Sequencing | Count | Status |
| --- | --- | --- |
| PacBio HiFi | 1 (batch placeholder) | Waiting — kit delays resolved; ready to begin extraction |

## Resources

- [[Satoyo Oya]] · [[Vianney Ahn]] · [[Jiani Li]]
- Material info shared with Vianney: [Google Doc](https://docs.google.com/document/d/1ECbRnoBNeeHqAvgHdRn6RUIydkCin1XxCy0ynCRd43A/edit)
- Wenfei somatic SNV calling reference: discussed at PAG 2026 (pipeline / repo to be confirmed)

## Open questions

- Whether Wenfei's somatic SNV pipeline is published with a public GitHub repo or is currently a general approach.
- Per-line accession breakdown (currently filed as a single batch-level card; should split when samples are extracted).

## Related

- [[methyltransferase-mutants]]
- [[col-0-plus]]
- [[mutation-accumulation]]

#project #arabidopsis #dna-repair #mutation-spectra #hifi #satoyo #active
