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

## Protocols

- [[poplar-leaf-collection]] -- Tree, branch, and leaf-cluster selection; labeling; flash-freeze on site
- [[shipping/shipping-samples-to-monroe-lab]] -- Packaging frozen samples on dry ice for shipment to UC Davis
- [[sorbitol-ctab-hifi-extraction]] -- Sorbitol/CTAB extraction protocol for high-molecular-weight DNA
- [[quantifying-dna-qubit]] -- DNA quantification with Qubit
- [[tube-and-sample-labeling]] -- Lab tube and sample labeling conventions
- [[sample-tracker-guide]] -- How we track samples through the pipeline

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
