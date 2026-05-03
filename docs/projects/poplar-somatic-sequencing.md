---
type: project
title: "Poplar Somatic Sequencing"
status: "active"
pi: "Grey Monroe"
lead: "Grey Monroe"
---

# Poplar Somatic Sequencing

**Status:** Active. Field collection April 2026.
**PI:** Grey Monroe
**Lab contacts:** Grey Monroe, Zi Ye, Marie Klein
**Funding:** CBI (Center for Bioenergy Innovation) contingency grant
**JGI Proposal:** BRC 512691 "Monitoring mutation accumulation in clonally propagated poplar feedstock" (accepted 2026-04-03)

---

## Project overview

We are characterizing the somatic mutation burden introduced during tissue culture (callus to shoot regeneration) in transgenic poplar trees. The central question: does tissue culture impose a meaningful mutational cost on the poplar biotechnology pipeline?

Twenty independent transformation events across six transgene constructs, plus wild-type and empty-vector controls, are planted at three replicated field sites. By building somatic mutation phylogenies from whole-genome sequencing of leaf tissue, we can measure the branch length attributable to the pre-regeneration (tissue culture) period and compare it to post-planting mutation accumulation in the field. Short-read sequencing (96 samples) provides the primary variant calls; long-read sequencing (24 samples) adds structural variant detection and cross-platform validation.

This project extends Grey's somatic mutation research program to a long-lived tree species and is funded through the CBI contingency award, with sequencing performed at JGI.

---

## Research questions

1. **Quantify tissue-culture mutation burden.** How many somatic mutations accumulated during callus culture and shoot regeneration, co-segregating with the transgene insertion?
2. **Compare to controls.** Do transgenic events accumulate more mutations than wild-type (no tissue culture) or empty-vector controls (tissue culture without transgene)?
3. **Assess field-environment effects.** Do trees at UC Davis, Maryland, and Oregon show different rates of post-planting somatic mutation accumulation?
4. **Resolve layer biology.** Can we distinguish mutations fixed at 100% VAF (present before meristematic layer separation) from layer-specific mutations (arising post-regeneration, detectable at ~50% VAF in leaves)?

---

## Genotypes

Twenty lines across 8 construct categories. All 20 are represented at all three field sites.

| Shorthand | Canonical Name | Type |
|---|---|---|
| `WT` | WT717 | Untransformed control (no tissue culture) |
| `EV` | Empty Vector (Cas9) | Tissue-culture control (no transgene) |
| `CK45` | Chx20, KO #45 | Transgenic Knockout |
| `CK54` | Chx20, KO #54 | Transgenic Knockout |
| `CK107` | Chx20, KO #107 | Transgenic Knockout |
| `CO61` | Chx20, OE #61 | Transgenic Overexpression |
| `CO74` | Chx20, OE #74 | Transgenic Overexpression |
| `CO78` | Chx20, OE #78 | Transgenic Overexpression |
| `DO29` | DIR18-OE_29 | Transgenic Overexpression |
| `DO89` | DIR18-OE_89 | Transgenic Overexpression |
| `DO214` | DIR18-OE_214 | Transgenic Overexpression |
| `EO5` | EXO70C2-OE_5 | Transgenic Overexpression |
| `EO17` | EXO70C2-OE_17 | Transgenic Overexpression |
| `EO24` | EXO70C2-OE_24 | Transgenic Overexpression |
| `XK1` | PtrXBAT35-KO #1 | Transgenic Knockout |
| `XK15` | PtrXBAT35-KO #15 | Transgenic Knockout |
| `XK59` | PtrXBAT35-KO #59 | Transgenic Knockout |
| `XO22` | PtrXBAT35-OE #22 | Transgenic Overexpression |
| `XO60` | PtrXBAT35-OE #60 | Transgenic Overexpression |
| `XO72` | PtrXBAT35-OE #72 | Transgenic Overexpression |
| `717` | 717-1B4 (border/spacer) | Untransformed spatial control |

---

## Constructs

Six transgene constructs plus two controls:

| Construct | Type | Events | Purpose |
|---|---|---|---|
| **CHX20-KO** | CRISPR Knockout | CK45, CK54, CK107 | Loss-of-function |
| **CHX20-OE** | Overexpression | CO61, CO74, CO78 | Gain-of-function |
| **DIR18-OE** | Overexpression | DO29, DO89, DO214 | Gain-of-function |
| **EXO70C2-OE** | Overexpression | EO5, EO17, EO24 | Gain-of-function |
| **PtrXBAT35-KO** | CRISPR Knockout | XK1, XK15, XK59 | Loss-of-function |
| **PtrXBAT35-OE** | Overexpression | XO22, XO60, XO72 | Gain-of-function |
| **Empty Vector** | Cas9 only | EV | Tissue-culture control (no transgene) |
| **Wild Type** | Untransformed | WT | Baseline (no tissue culture) |

All six transgene constructs are sampled equally (12 trees each across sites), providing balanced representation for cross-construct comparison of tissue-culture mutation burden.

---

## Field sites

All three sites were planted with clonal replicates of the same events in December 2023, enabling direct comparison of post-planting somatic mutation accumulation across environments.

| Site | Role | Trees Sampled | Contact |
|---|---|---|---|
| **UC Davis** | Primary collection site | 44 | Monroe Lab (Grey Monroe, Zi Ye, Marie Klein); field managed by Jack Bailey-Bale |
| **University of Maryland Eastern Shore (UMES)** | Replicate site | 26 | Jonathan Cumming (`jrcumming@umes.edu`) |
| **Westport, Oregon** | Replicate site | 26 | Brian Stanton, Poplar Innovations (`brian.stanton@poplarinnovations.com`) |

Guard trees at all sites are WT717, sourced from Living Carbon.

---

## Sampling scheme

**96 trees total across 3 sites. Two adjacent leaf clusters per tree. 96 short-read + 24 long-read sequencing libraries.**

| Site | Lines | Trees per line | Border 717 | Total trees | Total tubes |
|---|---|---|---|---|---|
| UC Davis | 20 | 2 | 2 | 42 | 84 |
| UMES (Maryland) | 20 | 1 | 1 | 21 | 42 |
| Westport (Oregon) | 20 | 1 | 1 | 21 | 42 |
| **Total** | | | | **84** | **168** |

### Sequencing budget

| Platform | Samples | Purpose |
|---|---|---|
| Illumina short-read | 96 | Primary variant calling; somatic phylogeny construction (>=50x coverage) |
| PacBio/ONT long-read | 24 | Structural variant detection; cross-validation of short-read calls |

Long-read allocation: 20 at Davis (one per event), 2 at UMES (WT + EV), 2 at Oregon (WT + EV). Each long-read sample is paired with a short-read sample from the same branch/leaf on the same tree for direct cross-platform comparison.

### Sampling logic

Each tree contributes **two adjacent leaf clusters** from a side branch with multiple branching events upstream of the sampled tissue. Each axillary branch is founded by a small number of cells from the parent meristem, and that cellular bottleneck "fixes" mutations from those founder cells across the whole new branch lineage. Deeper branches give higher-VAF mutations and more reliable variant calls.

---

## Davis Transgenic Site 2 — additional CJ lines

Marie sent over (2026-05-03) the planting list for **Transgenic Site 2** at Davis: 61 events from CJ also planted in the Davis field. **Plan:** collect leaf tissue from all 61 events (1 tree, 1 leaf cluster per event = 61 tubes), short-read only. Sequence as many as JGI capacity allows; cover any remainder with lab funds. No long-read on Site 2 events for now. Source: `/Users/greymonroe/Dropbox/myfiles/transgenic site 2 poplar.pdf`.

### Lignin / cell-wall pathway constructs (pCC series)

| Row | Construct | Event |
|---|---|---|
| 1 | pCC0998 (35S::PtCOMT1 RNAi) | 0998-30 |
| 2 | pCC0998 (35S::PtCOMT1 RNAi) | 0998-45 |
| 3 | pCC1019 (35S::PtF5H1 RNAi) | 1019-41 |
| 4 | pCC1019 (35S::PtF5H1 RNAi) | 1019-90 |
| 5 | pCC1020 (35S::PtF5H2 RNAi) | 1020-75 |
| 6 | pCC1020 (35S::PtF5H2 RNAi) | 1020-98 |
| 7 | pCC1034 (AtC4H::PtF5H1) | 1034-12 |
| 8 | pCC1034 (AtC4H::PtF5H1) | 1034-23 |
| 9 | pCC1035 (AtC4H::PtF5H2) | 1035-24 |
| 10 | pCC1035 (AtC4H::PtF5H2) | 1035-41 |
| 11 | pCC1049 (AtC4H::PtC3'H1 RNAi) | 1049-15 |
| 12 | pCC1049 (AtC4H::PtC3'H1 RNAi) | 1049-39 |

### Other transgenic events

| Row | Construct | Event |
|---|---|---|
| 13 | AN1/2-KO | 128-67 |
| 14 | AN1/2-KO | 128-7 |
| 15 | 35S::AN-Q11 | 191-13 |
| 16 | 35S::AN-Q11 | 191-21 |
| 17 | 35S::AN-Q11 | 191-43 |
| 18 | 35S::AN-Q15 | 192-31 |
| 19 | 35S::AN-Q15 | 192-5 |
| 20 | 35S::AN-Q15 | 192-6 |
| 21 | XB-mKO | 193-16 |
| 22 | XB-mKO | 193-31 |
| 23 | XB-mKO | 193-37 |
| 24 | RGA-4xKO | 267-17 |
| 25 | RGA-4xKO | 267-24 |
| 26 | RGA-4xKO | 267-49 |
| 27 | RGA-4xKO | 267-9 |
| 28 | 35S::BOOSTER | 284-34 |
| 29 | 35S::BOOSTER | 284-42 |
| 30 | 35S::BOOSTER | 284-60 |
| 31 | 35S::ATPase-eGFP-OE | 317-22 |
| 32 | 35S::ATPase-eGFP-OE | 317-45 |
| 33 | 35S::bHLH60-eGFP-OE | 327-24 |
| 34 | 35S::bHLH60-eGFP-OE | 327-25 |
| 35 | 35S::bHLH60-eGFP-OE | 327-9 |
| 36 | Cas9-EV | 59-70 |
| 37 | AtC4H::CtCBM11-IBP | BIBP GV 10 |
| 38 | AtC4H::CtCBM11-IBP | BIBP GV 12 |
| 39 | AtC4H::CtCBM11-IBP | BIBP GV 13 |
| 40 | AtC4H::CtCBM11-IBP | BIBP GV 16 |
| 41 | Cas9-EV | Cas9-19 |
| 42 | AtC4H::AtF5H O/E | F5H 37-2 |
| 43 | AtC4H::AtF5H O/E | F5H 64-1 |
| 44 | AtC4H::AtF5H O/E | F5H 82 |
| 45 | AtC4H::AtF5H O/E | F5H 85 |
| 46 | AtC4H::AtF5H O/E | F5H 85-9 |
| 47 | 35S::AtRGIL6 | Myst6 15 |
| 48 | 35S::AtRGIL6 | Myst6 2 |
| 49 | 35S::AtRGIL6 | Myst6 34 |
| 50 | 35S::AtRGIL6 | Myst6 37 |
| 51 | 35S::AtRGIL6 | Myst6 43 |
| 52 | 35S::AtRGIL6 | Myst6 7 |
| 53 | 35S::PtLecRLK1 | pp19 |
| 54 | 35S::PtLecRLK1 | pp7 |

### Controls

| Row | Construct | Event |
|---|---|---|
| 55 | WT717 | WT717 |
| 56 | WT717 | WT717 |
| 57 | WT717 | WT717 |
| 58 | LBL1 | LBL1 |
| 59 | LBL2 | LBL2 |
| 60 | LBL3 | LBL3 |
| 61 | LBL4 | LBL4 |

### Tallies

- 61 events total → 61 tubes (1 tree × 1 leaf cluster per event)
- 12 lignin/cell-wall (6 constructs × 2 events)
- 42 other transgenic events (across 14 construct categories)
- 7 controls (3 × WT717 + LBL1–4)
- 2 Cas9-EV events (rows 36, 41)

---

## Protocols

- [[poplar-leaf-collection]] -- Tree, branch, and leaf-cluster selection; labeling; flash-freeze on site
- [[shipping/shipping-samples-to-monroe-lab]] -- Packaging frozen samples on dry ice for shipment to UC Davis
- [[sorbitol-ctab-hifi-extraction]] -- Sorbitol/CTAB extraction protocol for high-molecular-weight DNA
- [[quantifying-dna-qubit]] -- DNA quantification with Qubit
- [[tube-and-sample-labeling]] -- Lab tube and sample labeling conventions
- [[accession-tracker-guide]] -- How we track accessions (and their physical samples/extractions/libraries) through the pipeline

---

## Timeline

| Milestone | Target |
|---|---|
| Collaborator collection requests sent | First week of April 2026 |
| UC Davis collection | Mid-April 2026 |
| Maryland and Oregon collection + shipping | Mid-April 2026 |
| All samples received at UC Davis | Late April 2026 |
| DNA extractions begin | Late April / May 2026 |
| Sequencing submission to JGI | Late May / early June 2026 |
| Analysis | TBD |

---

## Analysis plan

### Pipeline

Raw reads --> Quality control (FastQC, MultiQC) --> Alignment to *Populus* reference genome (BWA-MEM2) --> Duplicate marking --> Somatic variant calling (short reads: GATK Mutect2 or DeepVariant; long reads: PEPPER-Margin-DeepVariant or Clair3) --> Variant filtering --> Somatic phylogeny construction --> Mutation burden quantification --> Statistical comparison across events, genotypes, and sites.

### Key analyses

1. **Tissue-culture mutation burden:** Compare root-to-event-node branch lengths across transgenic events vs. WT and EV controls
2. **Transgene effect:** Test whether mutation burden differs across transgene lines
3. **Site effect:** Compare post-planting branch lengths across Davis, Maryland, and Oregon for the same events
4. **Layer resolution:** Classify mutations by VAF (100% = fixed across layers; ~50% = layer-specific)
5. **Mutation spectrum:** Characterize mutation types in tissue-culture vs. post-planting branches
6. **Structural variants (long-read):** T-DNA insertion structure and copy number; concordance of SNV/indel calls between platforms

---

## Team

| Person | Role |
|---|---|
| **Grey Monroe** | PI, UC Davis |
| **Jack Bailey-Bale** | UC Davis field site coordinator, manages Transgenic 1 site |
| **Marie Klein** | Postdoc, Davis field coordination (2 months funded) |
| **Zi Ye** | Davis field collection and extractions |
| **Jonathan Cumming** | UMES site lead (`jrcumming@umes.edu`) |
| **Brian Stanton** | Poplar Innovations, Westport Oregon site (`brian.stanton@poplarinnovations.com`) |
| **Gail Taylor** | UCL, co-PI, initiated the collaboration |
| **Tom Buckley** | UC Davis, co-PI (administrative routing) |
| **Melissa Cregger** | ORNL, CBI partner |

---

## Related

- [[poplar-leaf-collection]]
- [[shipping/shipping-samples-to-monroe-lab]]
- [Mutation Accumulation project](../projects/mutation-accumulation/index.md)
