---
type: protocol
title: "In-House vs Genome Center: HiFi Shearing and QC Decision"
---

# In-House vs Genome Center: HiFi Shearing and QC Decision

**Purpose:** Quick reference for how the [[in-house-hifi-shearing-pipeline]] and the [[uc-davis-dna-technologies-core]] **complement each other** for PacBio HiFi shearing and size QC.

**Framing:** the in-house Flongle pipeline is a **pre-Genome-Center diagnostic**, not a replacement for it. Use the Flongle to catch problems early and same-day; use the Genome Center for production sequencing and any trace that needs to go in a publication. Both have a permanent role. The layered model is: in-house for fast cheap screening across many use cases ([[in-house-hifi-shearing-pipeline]] § Use cases in priority order), Genome Center for production depth and publication-grade QC traces.

## Decision rules

**Use the in-house pipeline when:**
- Batch size **≥8 samples** (per-sample math favors in-house)
- You need **same-day turnaround**
- The Genome Center is queued out (>1 week)
- Noravit is unavailable
- You're iterating on shearing conditions and want fast feedback

**Use the Genome Center when:**
- Batch size **≤4 samples** (per-sample cost crosses over)
- The in-house path is broken or down
- You need a **FemtoPulse trace specifically for a publication, grant report, or external submission**
- You're running the validation calibration batch (you need both in parallel — see [[in-house-hifi-shearing]] § Validation Phase)
- The in-house workflow has not yet been validated against FemtoPulse for the sample type you're working with

## Cost comparison

Per-sample cost as a function of batch size:

| Batch size | In-house total | In-house per-sample | Genome Center total | Genome Center per-sample | Winner |
| --- | --- | --- | --- | --- | --- |
| 1 | ~$220 (1 Flongle, 1/6 kit) | $220 | $97 ($70 shear + $27 FemtoPulse) | $97 | Genome Center |
| 4 | ~$220 | $55 | $178 ($70 + $108) | $44 | Genome Center |
| 8 | ~$220 | $28 | $286 | $36 | **In-house** |
| 12 | ~$220 | $18 | $394 | $33 | **In-house** |
| 24 | ~$220 | $9 | $718 | $30 | **In-house** |

In-house cost: ~$90 [[flongle-flow-cells-flo-flg114]] + ~$117 [[sqk-nbd114-24]] (1/6 of $700 kit) + ~$10 plastics + NEB enzyme amortization from [[nebnext-companion-module-ont]] ≈ ~$220 fixed per Flongle run, regardless of how many barcodes you load (up to 24).

## Turnaround comparison

| Path | Best case | Typical | Worst case |
| --- | --- | --- | --- |
| In-house | 4 hr | 6-7 hr | next day |
| Genome Center | 3 days | 1 week | 2+ weeks |

## Quality comparison

| Metric | In-house Flongle | Genome Center FemtoPulse |
| --- | --- | --- |
| Measurement type | Direct read length | Inferred from electrophoretic mobility |
| Resolution above 15 kb | Excellent | Good |
| Per-sample histograms | Yes (NanoPlot) | Yes |
| Calibrated against absolute size standard | Once, in [[in-house-hifi-shearing]] § Validation Phase | Yes |
| Acceptable for publication figures | After validation logged | Yes |

## See also

- [[in-house-hifi-shearing-pipeline]]
- [[in-house-hifi-shearing]] (project)
- [[uc-davis-dna-technologies-core]]
- [[pacbio-hifi-sequencing]]
- Genome Center [CoreOmics submission portal](https://dnatech.genomecenter.ucdavis.edu/)
