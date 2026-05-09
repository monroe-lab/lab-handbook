---
type: "project"
title: "PBTS"
status: "active"
pi: "Grey Monroe"
lead: "Matt Davis"
last_updated: "2026-05-07"
---

# PBTS

Genomic dissection of Pistachio Bushy Top Syndrome (PBTS), a clonal-propagation disorder that affected ~1-2 million UCB-1 rootstock pistachios across 20,000-30,000 acres in California. The project sequences a field experiment of clonally propagated UCB-1 trees showing "bushy" and "cracky" variant phenotypes plus wild-type, looking for somatic mutations and chromosomal aneuploidies that explain the phenotypes.

## Summary

UCB-1 is the dominant pistachio rootstock in California, an interspecific hybrid (*P. atlantica* × *P. integerrima*) developed by Lee Ashworth at UC Berkeley in the 1980s. To produce uniform orchards, selections from UCB-1 seedling populations were tissue cultured and micropropagated. Starting around 2011, newly planted clonal UCB-1 trees in the southern San Joaquin Valley began exhibiting PBTS — shortened internodes, swollen lateral buds, witches'-broom growth, ~73% yield reduction. The cause has been debated for over a decade: *Rhodococcus fascians* (championed by Jennifer Randall, NMSU; Koch's postulates demonstrated by Elizabeth Fichtner) versus a somaclonal / genetic origin (championed by John Duarte). The PBTS field experiment, established Oct 2020, was set up to address this directly.

The Monroe Lab's contribution is the genomic side: build phylogenies of clones from somatic mutations, look for chromosome-level aneuploidy / deletion events using read-depth signal, and use variant allele frequency (VAF) analysis to identify layer-specific mutations. As of Mar 2026 the team has constructed a clone phylogeny, identified whole-chromosome duplications and deletions in depth dotplots, and is actively working on STRELKA2-based mutation calls. RNA-seq is planned to confirm layer-specificity.

HiFi long-read sequencing is now complete for all 12 accessions on this card (Novogene Revio, report 2026-05-07). See [HiFi sequencing QC (Novogene, May 2026)](#hifi-sequencing-qc-novogene-may-2026) below. Short-read WGS of leaf tissue from all living trees was completed earlier (June 2025 collection) and is not represented as accession cards on this page.

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

12 *Pistacia vera* HiFi accessions, all sequenced on PacBio Revio at Novogene (report delivered 2026-05-07).

| Status note | Count | Sample IDs |
| --- | --- | --- |
| HiFi sequenced (Novogene Revio, 2026-05-07) | 12 | `PGMD_2_8`, `Pt_Bushy_2`, `R1_B1_C7`, `R1_B2_C6`, `R1_B2_C9`, `R1_B3_C5`, `R1_B3_C8`, `R2_B2_C3`, `R2_B2_C4`, `R2_B3_C2`, `R2_B4_C1`, `R2_B4_C10` |

The R-prefixed IDs encode rep / block / clone (`R<rep>_B<block>_C<clone>`); 10 clones in randomized blocks were planted in Oct 2020. Filter the [accession index](../accessions/index.md) by `project: "PBTS"` for the live list. Short-read WGS of all living trees (collected June 2025) is tracked separately — those samples should be added as accession cards if not already present.

## HiFi sequencing QC (Novogene, May 2026)

Full Novogene QC report (PacBio Revio): [pbts-novogene-hifi-2026-05-07.html](../_supplemental/pbts-novogene-hifi-2026-05-07.html). Project number `X202SC25129719-Z01-F001`. Report `B1-5`, delivered 2026-05-07.

Headline numbers: ~1.16 Tb of HiFi data across all 12 samples (mean ~96 Gb / sample, range 87–105 Gb), mean read length ~17.9 kb, mean N50 ~18.2 kb. At an estimated *P. vera* genome size of ~600 Mb, this corresponds to roughly 145–175× HiFi coverage per sample.

Per-sample HiFi read statistics (from Novogene Table 3.1):

| Sample | Total bases (Gb) | Read number | Mean length (bp) | N50 (bp) | Max length (bp) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `PGMD_2_8` | 105.3 | 5,820,158 | 18,099 | 18,579 | 58,030 |
| `Pt_Bushy_2` | 93.8 | 5,462,911 | 17,167 | 17,538 | 53,115 |
| `R1_B1_C7` | 104.8 | 5,822,721 | 17,990 | 18,158 | 56,503 |
| `R1_B2_C6` | 91.1 | 5,145,049 | 17,698 | 17,850 | 62,279 |
| `R1_B2_C9` | 89.4 | 5,038,883 | 17,744 | 17,800 | 49,253 |
| `R1_B3_C5` | 93.7 | 5,297,639 | 17,688 | 17,950 | 54,351 |
| `R1_B3_C8` | 99.3 | 5,308,998 | 18,705 | 19,060 | 58,230 |
| `R2_B2_C3` | 87.1 | 4,769,805 | 18,267 | 18,420 | 54,295 |
| `R2_B2_C4` | 102.1 | 5,606,580 | 18,205 | 18,513 | 57,947 |
| `R2_B3_C2` | 93.3 | 5,179,950 | 18,003 | 18,287 | 54,619 |
| `R2_B4_C1` | 92.9 | 5,245,769 | 17,701 | 18,398 | 52,444 |
| `R2_B4_C10` | 104.1 | 5,769,444 | 18,041 | 18,302 | 54,985 |

Read length distributions per sample are in Figures 3.2–3.13 of the linked HTML report. Yields and N50s are uniform across the batch; no obvious outlier flagged in the report. Raw HiFi BAMs / FASTQs are downloaded from Novogene separately and not bundled with this QC HTML.

**Note on the library QC flag (Apr 30, 2026):** At the library-QC stage, Novogene (Yanan Liu) flagged `R2_B4_C1` as having "failed" QC due to slightly lower total yield, and warned the sequencing output for that sample might be below normal. Grey approved proceeding anyway. The final HiFi data is fine: `R2_B4_C1` came in at **92.9 Gb / N50 18.4 kb** — about 3 Gb under the batch mean and **not even the lowest in the batch** (`R2_B2_C3` 87.1 Gb, `R1_B2_C9` 89.4 Gb). Practical takeaway: Novogene's library-QC failure threshold has margin; a flagged library can still produce a perfectly usable sample.

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
- Novogene HiFi QC report (2026-05-07, project `X202SC25129719-Z01-F001`): [pbts-novogene-hifi-2026-05-07.html](../_supplemental/pbts-novogene-hifi-2026-05-07.html)
- Bushy/Cracky DNA extraction sheet: `bushy_cracky_dna_extraction.xlsx` (Google Drive)
- Reference: phased Kerman + UCB-1 parental backgrounds ([[pistachio-pangenome|Pistachio Pangenome]])
- Protocols: [[hifi-dna-extraction]], [[pistachio-dna-extraction]], [[pacbio-hifi-sequencing]]

## Related

- [[pistachio-pangenome]]
- [[kerman-somatic]]
- [[pistachio-hybrids]]

#project #pistachio #pbts #ucb1 #somatic-mutation #aneuploidy #hifi #active
