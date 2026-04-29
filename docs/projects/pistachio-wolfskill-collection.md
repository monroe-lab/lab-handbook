---
type: "project"
title: "Pistachio Wolfskill Collection"
status: "active"
pi: "Grey Monroe"
lead: "Chaehee Lee"
last_updated: "2026-04-28"
---

# Pistachio Wolfskill Collection

Genotyping and partial whole-genome sequencing of [[Patrick J Brown]]'s *Pistacia vera* diversity collection at the **UC Davis Wolfskill Experimental Orchard** (Winters, CA). 854 unique accession concept cards: 774 in the GBS diversity panel, plus 80 additional samples with Illumina WGS data only.

## Summary

The Wolfskill orchard hosts hundreds of *P. vera* trees representing Pat Brown's pistachio breeding and germplasm program. Material spans field-grid plantings (blocks A–E), commercial cultivars used as references (Golden Hills, Lost Hills, Gumdrop, Joley, Zarand), and named breeding selections (B15-69, B2-27, C2-35, etc.). The Monroe Lab partnered with Pat Brown's lab to genotype 774 of these trees using **GBS** (HindIII restriction-site enzyme, TASSEL-GBSv2 pipeline against the `Pvera_Kerman_RefGen_v1` reference) and to generate **Illumina WGS** for ~150 individuals (used to phase / impute the GBS calls and as standalone variant calls).

This panel is the working substrate for downstream pangenome and GWAS analyses: it underlies [[Pablo Luna Rodriguez]]'s [[Pacha]] graph-based haplotype-reconstruction pipeline (UCB1 test case), Chaehee's pangenome construction, and the GWAS for flowering / leafing date (chr 3 candidates `PvKer.03.g087700.t02` and `PvKer.03.g087730.t02` per the [[Pistachio Pangenome]] notes).

Not yet a paper — published nothing on this collection so far. Cards are scaffold-quality; deeper per-tree metadata (planting year, parents, phenotype) lives in Pat Brown's records, not in this lab handbook.

## People

- **PI:** [[Grey Monroe]] (Monroe Lab, UC Davis)
- **Lead (analysis):** [[Chaehee Lee]] (TASSEL pipeline, GWAS)
- **Pacha pipeline (haplotype reconstruction):** [[Pablo Luna Rodriguez]]
- **Source / breeder:** [[Patrick J Brown]] (UC Davis Plant Sciences) — owns the orchard material; supplied tissue and field metadata.
- Field manager: Zachary Uebelhor (Mondays / Tuesdays at Wolfskill).

## Sequencing summary

| Platform | Samples | Reference | Notes |
| --- | --- | --- | --- |
| GBS (HindIII) | 774 | `Pvera_Kerman_RefGen_v1` | Panel VCF `pistachio_diversity_HindIII_220207_vera`. Sample key: `tassel_vera/keys/pistachio_diversity_HindIII_key_220207_vera.txt` (chaehee permissions). |
| Illumina WGS | ~155 unique (73 paired with GBS, 80 WGS-only, plus a few unmapped legacy IDs) | `Pvera_Kerman_RefGen_v1` | Legacy IDs prefixed `DPIS<n>` mapped to current `WPI*` IDs in `imputation_wgs_vera/mapping_sampleID.txt`. WGS analysis dir: `/group/gmonroegrp2/chaehee/pistachio/wgs_wolfskill/`. |

### GBS panel breakdown

| Group | Samples | Pattern | Notes |
| --- | --- | --- | --- |
| Block A | 68 | `WPIA_<row>_<tree>` | Field grid |
| Block B | 60 | `WPIB_<row>_<tree>` | Field grid |
| Block C | 215 | `WPIC_<row>_<tree>` | Field grid |
| Block D | 122 | `WPID_<row>_<tree>` | Field grid |
| Block E | 294 | `WPIE_<row>_<tree>` | Field grid |
| Named cultivars / parents | 15 | e.g. `B15-69`, `Golden_Hills`, `Joley`, `Lost_Hills`, `Zarand` | Cultivars + Pat Brown breeding-line codes |
| **Total** | **774** | | |

## Notable accessions

- [[b15-69|B15-69]] — Female parent of ~10 wizened seedlings observed in one Wolfskill block (Apr 2026). See [[_active/wizened-pistachio-wgs|Wizened Pistachio WGS]] for the follow-up sequencing project.
- [[golden-hills|Golden Hills]], [[lost-hills|Lost Hills]] — Major US commercial cultivars; sister selections from UC Davis breeding.
- [[joley|Joley]] — Older US commercial cultivar.
- [[zarand|Zarand]] — Iranian *P. vera* cultivar.
- [[gumdrop-wolfskill|Gumdrop (Wolfskill)]] — Wolfskill source of the Gumdrop cultivar.

## Farm data layout (snapshot 2026-04-28)

- **GBS top-level:** `/group/gmonroegrp3/chaehee/pistachio/GBS_wolfskill_pjbrown/`
  - Raw lane fastq.gz (7 lanes, ~57 GB compressed): `raw_data/`
  - Trimmomatic-trimmed lane fastq.gz (top level)
  - TASSEL-GBSv2 outputs (filtered for *P. vera*): `tassel_vera/`
    - VCF + sample list: `tassel_vera/vcf/list_774vera.txt`
    - Imputed calls: `tassel_vera/imputed/`
    - WGS-imputation cross-reference: `tassel_vera/imputation_wgs_vera/mapping_sampleID.txt`
    - GWAS analyses (PCA, kinship, flowering / LFDA / phenology): `tassel_vera/analysis/`
  - Earlier TASSEL run (all-species): `tassel/`
  - Helper scripts: `run_trimmomatic-R1.sh`, `job_parallel_run_trimmomatic-R1.sh`
- **WGS analyses:** `/group/gmonroegrp2/chaehee/pistachio/wgs_wolfskill/`
  - GWAS outputs: `gwas/mlm_output/`, `gwas/mlm_output_FLOW/`
- **Pacha pipeline:** `/group/gmonroegrp2/chaehee/Pablo/`
  - PanGenie / SyRI alignments: `Pablo/pangenie/`

## Related

- [[Patrick J Brown]]
- [[Chaehee Lee]]
- [[Pablo Luna Rodriguez]]
- [[Pistachio Pangenome]] (sibling project — phased HiFi assemblies of *P. vera* + wild relatives that this panel is being lifted onto)
- [[_active/wizened-pistachio-wgs|Wizened Pistachio WGS]] (follow-up: sequencing wizened B15-69 progeny + controls)
- [[Pacha]] (Pablo's haplotype-reconstruction pipeline; uses this panel for validation)

#project #pistachio #pistacia-vera #wolfskill #breeding #gbs #gwas #pangenome #active
