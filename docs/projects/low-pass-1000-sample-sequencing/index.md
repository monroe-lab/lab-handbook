---
type: "project"
title: "Low-Pass 1000-Sample Sequencing"
status: "active"
pi: "Grey Monroe"
---

# Low-Pass 1000-Sample Sequencing

Drive the cost per sample of whole-genome skim sequencing as low as possible at thousand-sample scale. Target: **5× coverage of a ~600 Mb genome across ~1000 samples** using in-house 96-well DNA extraction + in-house Tn5 tagmentation + Illumina sequencing. The goal is to thread the needle between reagent cost and reliable library quality — enough Tn5, adapters, tips, and columns to do the run without panic, but not so much overkill that we burn project funds on shelf-warmers.

## Strategy

1. **96-well plant DNA extraction** — primary path is Qiagen DNeasy 96 Plant Kit. Homemade CTAB + silica backup path available if we want to shave cost further.
2. **In-house Tn5 tagmentation** — we want to be ready to pull the trigger on in-house Tn5 purification from [[addgene-ptxb1-tn5-plasmid]]. In parallel, buy commercial Tn5 from **both** Diagenode (preloaded) and Illumina (TDE1) so we have well-characterized references to benchmark in-house Tn5 against during optimization. Also buy unloaded (blank) Tn5 so we can practice adapter annealing + loading on commercial enzyme before trusting our own prep.
3. **Custom UDI indexing** — IDT 384-UDI primer set amortizes best past ~500 samples.
4. **Library cleanup** — use AMPure XP during optimization, then switch to homemade SPRI beads (Sera-Mag + PEG 8000) at full scale. Rohland & Reich 2012 chemistry. This is where the biggest bulk consumable savings live.
5. **QC** — Qubit HS dsDNA for individual libraries, PicoGreen 96-well for batch quantification, KAPA qPCR Library Quant Kit for final molarity before pooling.

## Scale math (order-of-magnitude)

| Quantity | Value |
|---|---|
| Samples | 1000 |
| Target coverage | 5× |
| Genome size | ~600 Mb |
| Data per sample | 3 Gb |
| Total sequencing output | ~3 Tb |
| Reagent over-order factor | 2× (so plan for 2000 reactions / preps) |

2000 is the number to size reagent orders against. If a consumable would dip below ~50% of its current stock during this project alone, we top up so we don't starve other projects.

## Tn5 optimization plan

Three parallel Tn5 sources so we have something well-characterized no matter what goes sideways:

- [[diagenode-tagmentase-loaded]] — 500-reaction bulk, preloaded ME-A/B. Known good reference.
- [[illumina-tagment-dna-enzyme-tde1]] — 96 reactions, preloaded Nextera adapters. Second independent commercial reference.
- [[tn5-unloaded-blank]] + [[idt-tn5merev-oligo]] + [[idt-tn5me-a-oligo]] + [[idt-tn5me-b-oligo]] — load our own adapters onto commercial enzyme to validate the loading protocol before committing to in-house-purified Tn5.
- [[addgene-ptxb1-tn5-plasmid]] + [[bl21-de3-competent-cells]] + [[neb-chitin-resin]] — full in-house Tn5 production track. See [[tn5-loading-library-prep]] for the existing protocol.

## Equipment decisions

- **Tissue grinding** — use [[automill]]. No GenoGrinder / TissueLyser needed.
- **Plate centrifuge** — [[centrifuge]] on hand. Determine whether this covers silica-plate washes or whether a vacuum manifold is required before ordering.
- **Vacuum manifold** — [[vacuum-manifold-96-well]] is NOT in the lab. Listed as "decide before ordering." Optional if plate centrifuge works with the chosen extraction protocol.
- **TapeStation** — not ordering. HS D1000 reagents and screen tapes are therefore **skipped**.
- **Probe sonicator for Tn5 lysis** — use a core facility rather than buy.

## Chart string

TBD — pick an eligible startup or grant account. Grey confirms with Alice Jungwirth before orders are submitted; account strings stay in the private vault, not here.

## Sub-pages

- [[bill-of-materials]] — full vendor-grouped ordering table with inventory-matched status

## Related protocols

- [[tn5-loading-library-prep]] — in-house Tn5 loading and tagmentation
- [[protein-induction-bl21]] — BL21(DE3) protein induction (used for Tn5 purification)

## Related projects

- [[alfalfa-pangenome]]
- [[pistachio-pangenome]]
- [[mutation-accumulation]]
