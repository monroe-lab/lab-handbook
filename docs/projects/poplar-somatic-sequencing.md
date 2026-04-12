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

---

## What this project is

We're characterizing the somatic mutation burden introduced during tissue culture (callus to shoot regeneration) in transgenic poplar. The central question: do tissue-culture-origin mutations represent a meaningful concern for the poplar biotechnology program? We answer it by building somatic mutation phylogenies from leaf tissue across replicated transgenic events at three field sites and measuring the branch length attributable to the pre-regeneration period.

## Aims

1. **Quantify the tissue-culture mutation burden.** How many mutations accumulated during callus and regeneration, co-segregating with the transgene insertion?
2. **Compare to controls.** Do transgenic events accumulate more mutations than wild type or empty-vector controls that did or did not undergo tissue culture?
3. **Test for site effects.** Do trees at UC Davis, Maryland, and Oregon show different post-planting mutation accumulation rates?
4. **Resolve layer biology.** Can we distinguish mutations fixed at 100% VAF (pre-layer-separation) from layer-specific mutations (post-regeneration)?

## Field sites and contacts

| Site | Role | Contact |
|---|---|---|
| **UC Davis** | Primary collection site | Monroe Lab (Grey, Zi Ye, Marie Klein) |
| **University of Maryland Eastern Shore** | Replicate site | Jonathan Cumming (`jrcumming@umes.edu`) |
| **Westport, Oregon** | Replicate site | Brian Stanton (`brian.stanton@poplarinnovations.com`) |

All three sites were planted in December 2023 with clonal replicates of the same events, enabling direct comparison of post-planting somatic mutation accumulation across environments. All 20 transformation events are represented at all 3 sites.

## Sampling scheme

**One tree per line per site, plus one 717 border/spacer tree per site. UC Davis samples 2 trees per line for within-line replication. Two adjacent leaf clusters per tree.**

| Site | Lines | Trees per line | Border 717 | Total trees | Total tubes |
|---|---|---|---|---|---|
| UC Davis | 20 | 2 | 2 | 42 | 84 |
| UMES (Maryland) | 20 | 1 | 1 | 21 | 42 |
| Westport (Oregon) | 20 | 1 | 1 | 21 | 42 |
| **Total** | | | | **84** | **168** |

The 20 lines are: WT717, EV-Cas9 (empty vector), and 18 transgenic events spread across CHX20-KO/OE, DIR18-OE, EXO70C2-OE, and PtrXBAT35-KO/OE constructs (3 events each). Sequencing budget is 96 short-read + 24 long-read libraries; the LR vs SR allocation per tube is sorted out at extraction time.

Each tree contributes **two adjacent leaf clusters** from a side branch with multiple branching events upstream of the sampled tissue. The branching depth matters for mutation calling: each axillary branch is founded by a small number of cells from the parent meristem, and that bottleneck "fixes" mutations from those founder cells across the whole new branch lineage. Deeper branches give higher-VAF mutations and more reliable variant calls.

## Protocols

- [Poplar Leaf Collection](../plant-harvesting/poplar-leaf-collection.md) — tree, branch, and leaf-cluster selection; labeling; flash-freeze on site
- [Shipping Samples to Monroe Lab (Collaborator Guide)](../shipping/shipping-samples-to-monroe-lab.md) — packaging, dry ice, label workflow

## Timeline

| Milestone | Target |
|---|---|
| Collaborator collection requests sent | First week of April 2026 |
| UC Davis collection | Mid-April 2026 |
| Maryland and Oregon collection + shipping | Mid-April 2026 |
| Samples received at UC Davis | Late April 2026 |
| DNA extractions begin | Late April / May 2026 |
| Sequencing submission | TBD (JGI process) |
| Analysis | TBD |

## Why now (the urgency)

Leaves are aging, personnel availability is constrained at all three sites, and the project is on the critical path for demonstrating progress to the CBI / CPI poplar biotechnology consortium. Collection in April 2026 is non-negotiable.

## Related

- [Poplar Leaf Collection protocol](../plant-harvesting/poplar-leaf-collection.md)
- [Shipping Samples to Monroe Lab](../shipping/shipping-samples-to-monroe-lab.md)
