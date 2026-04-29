---
type: "project"
title: "PBTS"
status: "active"
pi: "Grey Monroe"
lead: "Matt Davis"
last_updated: "2026-04-29"
---

# PBTS

Genomic dissection of Pistachio Bushy Top Syndrome (PBTS), a clonal-propagation disorder that affected ~1-2 million UCB-1 rootstock pistachios across 20,000-30,000 acres in California. The project sequences a field experiment of clonally propagated UCB-1 trees showing "bushy" and "cracky" variant phenotypes plus wild-type, looking for somatic mutations and chromosomal aneuploidies that explain the phenotypes.

## Summary

UCB-1 is the dominant pistachio rootstock in California, an interspecific hybrid (*P. atlantica* × *P. integerrima*) developed by Lee Ashworth at UC Berkeley in the 1980s. To produce uniform orchards, selections from UCB-1 seedling populations were tissue cultured and micropropagated. Starting around 2011, newly planted clonal UCB-1 trees in the southern San Joaquin Valley began exhibiting PBTS — shortened internodes, swollen lateral buds, witches'-broom growth, ~73% yield reduction. The cause has been debated for over a decade: *Rhodococcus fascians* (championed by Jennifer Randall, NMSU; Koch's postulates demonstrated by Elizabeth Fichtner) versus a somaclonal / genetic origin (championed by John Duarte). The PBTS field experiment, established Oct 2020, was set up to address this directly.

The Monroe Lab's contribution is the genomic side: build phylogenies of clones from somatic mutations, look for chromosome-level aneuploidy / deletion events using read-depth signal, and use variant allele frequency (VAF) analysis to identify layer-specific mutations. As of Mar 2026 the team has constructed a clone phylogeny, identified whole-chromosome duplications and deletions in depth dotplots, and is actively working on STRELKA2-based mutation calls. RNA-seq is planned to confirm layer-specificity, and HiFi long-read sequencing is in progress for the most informative clones (1, 2, 4, 6, 7).

The 12 accessions on this card are the long-read (HiFi) batch currently at the UC Davis Genome Center for QC and shearing. Two are progressing through library prep (`PGMD_2_8` and `Pt_Bushy_2`); the remaining ten R-prefixed samples are at the shearing stage. Short-read WGS of leaf tissue from all living trees was completed earlier (June 2025 collection) and is not represented as accession cards on this page.

## People

- **PI:** [[Grey Monroe]]
- **Lead:** [[Matt Davis]]
- HiFi extraction / library prep: [[Vianney Ahn]], [[Erik Spaulding]]
- External collaborators (plain text):
  - Chuck Leslie (UC Davis tissue culture collections) — supplied / managed PBTS tissue culture material
  - Steven Lee (UC Davis tissue culture) — current contact for in-culture PBTS shoots (per Chuck, Apr 2026)
  - Patrick J Brown (UC Davis Plant Sciences) — UCB-1 / pistachio breeding program
  - Bob Schmitz (UGA) — scRNA / scATAC libraries on PBTS shoots, layer specificity confirmation

## Sequenced samples (HiFi batch)

12 *Pistacia vera* HiFi accessions currently being processed at the UC Davis Genome Center.

| Status note | Count | Sample IDs |
| --- | --- | --- |
| Sequencing in progress | 2 | `PGMD_2_8`, `Pt_Bushy_2` |
| Shearing (Genome Center, QC + shearing) | 10 | `R1_B1_C7`, `R1_B2_C6`, `R1_B2_C9`, `R1_B3_C5`, `R1_B3_C8`, `R2_B2_C3`, `R2_B2_C4`, `R2_B3_C2`, `R2_B4_C1`, `R2_B4_C10` |

The R-prefixed IDs encode rep / block / clone (`R<rep>_B<block>_C<clone>`); 10 clones in randomized blocks were planted in Oct 2020. Filter the [accession index](../accessions/index.md) by `project: "PBTS"` for the live list. Short-read WGS of all living trees (collected June 2025) is tracked separately — those samples should be added as accession cards if not already present.

## Field experiment

- Material received from 3 nurseries (5, 2, and 3 clones respectively).
- Isolated as single-shoot-descent lines, confirmed *Rhodococcus*-free in tissue culture.
- Maintained in culture until 2017 planting.
- Field experiment established October 2020 with 10 clones in randomized blocks.
- Several trees lost by June 2025; remaining trees show bushy, cracky, or wild-type phenotypes.

## Analysis snapshot (Mar 2026)

- Phylogeny of clones constructed from somatic mutations.
- Whole-chromosome duplication / deletion events visible in depth dotplots (chromosome-level aneuploidies).
- VAF analysis identifies layer-specific duplications.
- STRELKA2-based mutation identification under development.
- HMW DNA extractions in progress (pre-Matt-Europe-departure push, March 2026).
- New tissue-culture-shoot sequencing methods being planned by [[Vianney Ahn]] using shoots still in culture (sourced via Chuck Leslie / Steven Lee).

## Resources

- [[Matt Davis]] · [[Vianney Ahn]] · [[Erik Spaulding]]
- Master sample tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI/edit)
- Pistachio HiFi QC sheet: [Google Sheet](https://docs.google.com/spreadsheets/d/15UrgolI_mokQOI63vG_FZkUTp-KYBa9pXHJcCsuL4JE)
- Bushy/Cracky DNA extraction sheet: `bushy_cracky_dna_extraction.xlsx` (Google Drive)
- Reference: phased Kerman + UCB-1 parental backgrounds ([[pistachio-pangenome|Pistachio Pangenome]])
- Protocols: [[hifi-dna-extraction]], [[pistachio-dna-extraction]], [[pacbio-hifi-sequencing]]

## Related

- [[pistachio-pangenome]]
- [[kerman-somatic]]
- [[pistachio-hybrids]]

#project #pistachio #pbts #ucb1 #somatic-mutation #aneuploidy #hifi #active
