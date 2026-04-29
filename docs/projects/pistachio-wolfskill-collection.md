---
type: "project"
title: "Pistachio Wolfskill Collection"
status: "archived"
pi: "Grey Monroe"
lead: "Chaehee Lee"
last_updated: "2026-04-29"
---

# Pistachio Wolfskill Collection

Monroe Lab Illumina whole-genome sequencing of [[Patrick J Brown]]'s *Pistacia vera* diversity collection at the **UC Davis Wolfskill Experimental Orchard** (Winters, CA). 153 unique accessions sequenced; 2 of those have technical replicates (a second extraction / library).

## Summary

The Wolfskill orchard hosts hundreds of *P. vera* trees representing Pat Brown's pistachio breeding and germplasm program. Pat Brown's lab generated GBS data for 774 trees (separate dataset, not Monroe Lab work). The Monroe Lab whole-genome sequenced a subset for use as imputation references and stand-alone variant calls feeding pangenome and GWAS analyses.

This panel is the working substrate for downstream pangenome and GWAS analyses: it underlies [[Pablo Luna Rodriguez]]'s [[Pacha]] graph-based haplotype-reconstruction pipeline (UCB1 test case), Chaehee's pangenome construction, and the GWAS for flowering / leafing date (chr 3 candidates `PvKer.03.g087700.t02` and `PvKer.03.g087730.t02` per the [[Pistachio Pangenome]] notes).

Not yet published. Concept-level cards only — per-tree metadata (planting year, parents, phenotype) lives in Pat Brown's records.

## People

- **PI:** [[Grey Monroe]] (Monroe Lab)
- **Lead (analysis):** [[Chaehee Lee]]
- **Pacha pipeline (haplotype reconstruction):** [[Pablo Luna Rodriguez]]
- **Source / breeder:** [[Patrick J Brown]] — owns the orchard material; supplied tissue.
- Field manager: Zachary Uebelhor (Mondays / Tuesdays at Wolfskill).

## Sequencing

| Platform | Unique accessions | Technical replicates | Reference | Farm path |
| --- | --- | --- | --- | --- |
| Illumina WGS | 153 | 2 accessions × 2 replicates each | `Pvera_Kerman_RefGen_v1` | `/group/gmonroegrp2/chaehee/pistachio/wgs_wolfskill/` |

**Technical replicates** (each represents a second extraction / library prep of the same tree):

| Accession | Legacy library IDs |
| --- | --- |
| [[wpia-11-1\|WPIA_11_1]] | `DPIS41`, `DPIS541` |
| [[wpia-14-4\|WPIA_14_4]] | `DPIS122`, `DPIS122B` |

Legacy library IDs are prefixed `DPIS<n>` and map to current `WPI<block>_<row>_<tree>` field-grid IDs in `imputation_wgs_vera/mapping_sampleID.txt`. One sample (`DPIS557`) has no WPI mapping and is filed under its legacy ID.

## Out of scope (not in this WGS panel)

The 774-tree GBS panel from Pat Brown's lab includes named cultivars (Golden Hills, Lost Hills, Joley, Zarand, Gumdrop) and the breeding selection **B15-69** (female parent of the wizened-seedling lineage — see [[_active/wizened-pistachio-wgs|Wizened Pistachio WGS]]). These are NOT in the Monroe-Lab WGS subset and therefore have no accession card in the lab handbook. When the wizened-pistachio sequencing happens (planned May 2026), those samples will get cards under that project.

## Farm data layout (snapshot 2026-04-29)

- **WGS analyses + variant calls:** `/group/gmonroegrp2/chaehee/pistachio/wgs_wolfskill/`
  - GWAS outputs: `gwas/mlm_output/`, `gwas/mlm_output_FLOW/`
- **Pacha pipeline (uses these WGS calls):** `/group/gmonroegrp2/chaehee/Pablo/`
- **DPIS<->WPI mapping (canonical):** `/group/gmonroegrp3/chaehee/pistachio/GBS_wolfskill_pjbrown/tassel_vera/imputation_wgs_vera/mapping_sampleID.txt`

## Related

- [[Patrick J Brown]]
- [[Chaehee Lee]]
- [[Pablo Luna Rodriguez]]
- [[Pistachio Pangenome]] (sibling project — phased HiFi assemblies that this WGS panel is being lifted onto)
- [[_active/wizened-pistachio-wgs|Wizened Pistachio WGS]] (follow-up: sequencing wizened B15-69 progeny + controls)
- [[Pacha]] (Pablo's haplotype-reconstruction pipeline; uses this WGS panel for validation)

#project #pistachio #pistacia-vera #wolfskill #wgs #pangenome #archived
