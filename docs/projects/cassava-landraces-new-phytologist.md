---
type: "project"
title: "Cassava Landraces (New Phytologist 2026)"
status: "archived"
pi: "Grey Monroe"
lead: "Kehan Zhao"
last_updated: "2026-04-29"
---

# Cassava Landraces (New Phytologist 2026)

Whole-genome sequencing and analysis of 393 Colombian cassava (*Manihot esculenta*) landraces and wild *Manihot* relatives from the CIAT germplasm collection, plus 9 PacBio HiFi de novo assemblies. Published as Zhao et al. 2026, *New Phytologist*.

## Summary

Cassava is a staple crop across the global south, but modern breeding lines have limited genetic diversity due to historical bottlenecks. This project sequenced 387 newly characterized Colombian landraces from the CIAT collection — spanning diverse climates and elevations — together with wild relatives from across the *Manihot* genus, and combined them with > 1,000 publicly available cassava genotypes. We assessed genetic differentiation across geography and climate, and analyzed the distribution of loss-of-function (LoF) mutations to identify potential targets for gene editing and breeding.

Key findings: landraces retain high and novel dimensions of genetic diversity compared to Asian and African breeding lines; LoF analyses show purging of deleterious alleles through inbreeding, but LoF retention in genes for coumarin biosynthesis and plant immunity (suggesting selection for postharvest quality and disease resistance); climate-associated loci identified.

## People

- **Lead:** [[Kehan Zhao]]
- **PI:** [[Grey Monroe]]
- Co-authors: Evan Long (USDA-ARS, Kimberly ID), Francisco Sanchez (CIAT), Erwan Monier (UC Davis LAWR), Paul Chavarriaga (CIAT)

## Publication

- **Citation:** Zhao K, Long E, Sanchez F, Monier E, Chavarriaga P, Monroe G. (2026). Unlocking genetic diversity in Colombian cassava landraces for accelerated breeding. *New Phytologist* **250**(3): 1905–1917.
- **DOI:** [10.1111/nph.70918](https://doi.org/10.1111/nph.70918)
- Published online 2026-01-19; print May 2026.
- **Funding:** Foundation for Food and Agriculture Research (FFAR), award ICRC20-0000000014.

## Data releases

- **Variant call set:** [cassavabase.org protocol #64](https://cassavabase.org/breeders_toolbox/protocol/64) — full VCF, lifted-over genotypes for the 1,152 cassava panel. Submitted by Kehan Zhao, confirmed by Isaak Tecle (Cornell, BTI) March 2026.
- **Raw Illumina reads:** [NCBI SRA BioProject PRJNA1228154](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1228154) (420 SRA runs; sample metadata in paper Table S1).
- **PacBio HiFi assemblies:** raw reads on Farm under `/group/gmonroegrp3/cassava/hifi/`. Assembly outputs by Evan Long (USDA-ARS); PER413-5A reads not yet assembled.

## Sequenced samples

393 unique accessions sequenced across three Illumina WGS batches plus 9 PacBio HiFi de novo assemblies. Concept-level accession cards exist for every sample under [[accessions]] — filter by `project: "Cassava Landraces (New Phytologist 2026)"`.

| Group | Species | Count | Notes |
| --- | --- | --- | --- |
| Colombian landraces (`COL`) | *M. esculenta* | 326 | Main focus of the paper. Sourced from the CIAT germplasm bank. |
| Peruvian (`PER`) | *M. esculenta* subsp. *peruviana* | 26 | Wild progenitor / outgroup samples (PER407, PER410, PER411, PER413, PER415, PER416). |
| `TSTXXX` | *M. tristis* | 9 | Wild relative. |
| `TPHXXX` | *M. triphylla* | 7 | Wild relative. |
| `ORBXXX` | *M. orbicularis* | 5 | Wild relative. |
| `CAEXXX` | *M. caerulescens* | 4 | Wild relative. |
| `LONXXX` | *M. longipetiolata* | 2 | Wild relative. |
| `CTH417` | *M. carthagenensis* | 1 | Wild relative. |
| `ALTXXX` | *M. alutacea* | 1 | Wild relative. |
| CIAT lines (`CM`, `SM`, `SMB`, `CG`) | *M. esculenta* | 8 | Selected breeding lines. |
| Other (`HMC`, `IMPER`, `TAI`, `VEN`) | *M. esculenta* | 4 | Comparison / outgroup material. |
| **Total** | | **393** | 8 of 9 HiFi accessions also have Illumina (COL1484 is HiFi-only). |

### PacBio HiFi assemblies (9 accessions)

| Accession | PB run | Farm path |
| --- | --- | --- |
| [[col875\|COL875]] | PB840 cell 01 | `/group/gmonroegrp3/cassava/hifi/PB840_01_Col875_Cassava_HiFiv3/` |
| [[col1484\|COL1484]] | PB840 cell 02 | `/group/gmonroegrp3/cassava/hifi/PB840_02_Col1484_Cassava_HiFiv3/` |
| [[col856\|COL856]] | PB848 cell 01 | `/group/gmonroegrp3/cassava/hifi/PB848_01_Col856_Cassava_HiFiv3/` |
| [[col282\|COL282]] | PB848 cell 02 | `/group/gmonroegrp3/cassava/hifi/PB848_02_Col282_Cassava_HiFiv3/` |
| [[col1010b\|COL1010B]] | PB848 cell 03 | `/group/gmonroegrp3/cassava/hifi/PB848_03_Col1010B_Cassava_HiFiv3/` |
| [[col386\|COL386]] | PB963 3-plex Revio (bc1017) | `/group/gmonroegrp3/cassava/hifi/PB963_3plex_Cassava_HiFiv3_Revio_cell1/` |
| [[col517\|COL517]] | PB963 3-plex Revio (bc1018) | `/group/gmonroegrp3/cassava/hifi/PB963_3plex_Cassava_HiFiv3_Revio_cell1/` |
| [[col1678\|COL1678]] | PB963 3-plex Revio (bc1019) | `/group/gmonroegrp3/cassava/hifi/PB963_3plex_Cassava_HiFiv3_Revio_cell1/` |
| [[per413-5a\|PER413-5A]] | PB1072 Revio | `/group/gmonroegrp3/cassava/hifi/PB1072_Per413-5A_Cassava_HiFiv3_Revio_cell1/` |

## Farm data layout (snapshot 2026-04-28)

- **Top-level:** `/group/gmonroegrp3/cassava/` — managed by [[Kehan Zhao]]; ~14.7 TB total.
- **Illumina raw reads:** packaged as tarballs at the top level
  - `Batch_1.tar.gz` (3.9 TB, 225 sample dirs) — manifest: `Batch_1_manifest.txt`
  - `Batch_2n3.tar.gz` (1.1 TB, 73 sample dirs) — manifest: `Batch_2n3_manifest.txt`
  - `Batch_4.tar.gz` (1.2 TB, 85 sample dirs) — manifest: `Batch_4_manifest.txt`
- **HiFi:** `/group/gmonroegrp3/cassava/hifi/` (one subdir per PB run; see table above).
- **Pipeline scripts:** `/group/gmonroegrp3/cassava/sh_files/` (`download_BGI.sh`, `aspera_ncbi.sh`, `copy_files*.sh`, `move_files.sh`).
- **SLURM logs:** `/group/gmonroegrp3/cassava/report/`.

To extract a specific sample's reads from a tarball:

```bash
# Example: pull COL875 reads from Batch_2n3
tar -xzvf /group/gmonroegrp3/cassava/Batch_2n3.tar.gz \
  Batch_2n3/clean/COL_875/
```

## Resources

- [[Kehan Zhao]]
- [Paper (DOI)](https://doi.org/10.1111/nph.70918)
- [VCF: cassavabase.org protocol #64](https://cassavabase.org/breeders_toolbox/protocol/64)
- [SRA: PRJNA1228154](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1228154)
- Farm data: `/group/gmonroegrp3/cassava/` (snapshot 2026-04-28)

## Related

- [[Kehan Zhao]]

#project #cassava #manihot #landrace #pangenome #ciat #new-phytologist #completed
