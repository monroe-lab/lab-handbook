---
type: "project"
title: "Bill of Materials — Low-Pass 1000-Sample Sequencing"
---

# Bill of Materials

Full ordering list for [[low-pass-1000-sample-sequencing]] against current lab inventory as of **2026-04-22**. Scale target: 1000 samples × 2× safety factor = **2000 reactions / preps** of consumable planning.

## Legend

| Status | Meaning |
|---|---|
| **HAVE** | Sufficient quantity on hand for 2000-reaction scale without biting into other projects' stocks. |
| **TOP UP** | Have some, but would deplete below ~50% during this project. Order more. |
| **ORDER NEW** | Not in lab inventory. New concept card written; needs a fresh order. |
| **SKIP** | Listed in the original draft but we are deliberately not ordering. |

## Chart string

Pick from startup funds (see [[Accounts Overview]]); confirm with [[Alice Jungwirth]]. All punch-out line items will need the chart string entered per-line in Aggie Enterprise — see [[Purchasing & Procurement#System 1 Aggie Enterprise existing vendors]].

---

## Aggie Enterprise Punch-Out Orders

These all go via Aggie Enterprise punch-out catalogs and can be submitted in one sitting. See [[Purchasing & Procurement#System 1 Aggie Enterprise existing vendors]]. Reassign to [[Susan Hendrickson]] once the chart string is on every line.

### Millipore Sigma (punch-out)

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[cetrimonium-bromide]] (CTAB) | C2432 | ~500 g | 900 g | HAVE | Plenty for CTAB extraction if we go that path. |
| [[2-mercaptoethanol]] | M6250 | 100 mL | "50 g" (likely mL, one old bottle) | TOP UP | Stock label says g but BME is liquid — old bottle, probably depleted. Order 100 mL. |
| [[chloroform]] | 366919 | 4 L | 1 L | TOP UP | 1 L won't cover CTAB-pathway extractions at 2000 scale. Order 4 L. |
| [[isopropyl-alcohol]] | I9516 | 4 L (mol bio) | 6 L (generic) + 2 L second bottle | TOP UP | Generic isopropanol — confirm mol-bio grade is required; if yes, order fresh I9516 4 L. |
| [[ethanol-absolute]] | E7023 | 4–8 L (200 proof) | 1 gal (~3.8 L) | TOP UP | Ethanol washes are high-volume at 96-well × 2000 scale. Order another 4 L minimum. |
| [[rnase-aliquot]] / RNase A bulk | R6513 | 100 mg | aliquots only | TOP UP | Have single-use aliquots; for 2000 preps order a bulk 100 mg powder bottle. |
| [[sigma-proteinase-k]] | P2308 | 100 mg | — | ORDER NEW | Not currently stocked as a bulk reagent. |
| [[polyvinylpyrrolidone]] (PVP-40) | PVP40 | 100 g | 1200 g | HAVE | Enormous stock. |
| [[polyvinylpolypyrrolidone-pvpp]] (PVPP) | P6755 | 100 g | — | ORDER NEW | Different reagent from PVP-40; used together in some CTAB recipes. |
| [[taps]] free acid | T9659 | 100 g | 100 g | HAVE | Good, but tight — one protocol run away from empty. If TAPS is in every buffer, consider topping up. |
| [[magnesium-chloride]] (solid) | M1028 | 1M soln, 100 mL | 200 g solid | HAVE | Solid is fine; we make 1 M solutions as needed. |
| [[polyethylene-glycol-solid]] (PEG 8000) | 89510 | 500 g | 600 g | HAVE | Covers homemade SPRI and buffer use. |
| [[dimethylformamide-anhydrous]] (DMF) | 227056 | 1 L | — | ORDER NEW | **Confirm actually needed** — the Tn5 protocol in [[tn5-loading-library-prep]] should be checked. DMF ≠ DMSO. |
| [[sodium-dodecyl-sulfate]] (SDS, solid) | 71736 | 10% soln, 1 L | 160 g solid | HAVE | Make 10% from solid. |
| [[tween-20]] (polysorbate 20) | P9416 | 500 mL | — (Tween 80 only) | ORDER NEW | Tween 20 and Tween 80 are different reagents. |
| [[hepes]] free acid | H3375 | 250 g | 100 g | TOP UP | HEPES is in Tn5 storage buffer. Order another 250 g. |
| [[sodium-chloride]] (mol biol grade) | S3014 | 1 kg | 5.45 kg | HAVE | Plenty. |
| [[triton-x-100]] | X100 | 500 mL | 600 mL | HAVE | |
| [[glycerol-50-aqueous-solution]] | G5516 | 1 L | 350 mL (50%) | TOP UP | For Tn5 storage buffer (typically 50% glycerol) 350 mL is tight. Order 1 L neat glycerol. |
| [[iptg]] | I6758 | 25 g | — | ORDER NEW | For BL21 induction during Tn5 purification. |
| [[dithiothreitol-dtt]] | D0632 | 25 g | — | ORDER NEW | Reducing agent in Tn5 lysis/storage buffers. |
| [[roche-protease-inhibitor-cocktail-edta-free]] | 11873580001 | 20 tabs | — | ORDER NEW | EDTA-free so it doesn't chelate Mg²⁺ needed downstream. |
| [[benzonase-nuclease]] | E1014 | 10 kU | — | ORDER NEW | Host-DNA clearance during Tn5 lysate prep. |
| [[lambda-dna-standard]] | D1501 | 250 μg | — | ORDER NEW | Tagmentation positive control + Qubit/PicoGreen standard. |
| [[bradford-reagent]] | B6916 | 500 mL | — | ORDER NEW | Quick protein QC for Tn5 fractions. |

### Fisher Scientific / Thermo (punch-out)

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[qiagen-dneasy-96-plant-kit]] | 69181 | 5–6 kits (~2000 preps) | 1 DNeasy **mini** (wrong format) | ORDER NEW | Existing stock is single-tube mini kit — not the 96-well format. Different SKU. |
| [[qubit-dsdna-hs-assay-kit]] | Q32854 | ≥1 × 500 assays | owned (qty unknown) | TOP UP | Verify remaining count; order more if under ~500 left. |
| [[quant-it-picogreen-dsdna-kit]] | P7589 | 1 kit | — | ORDER NEW | Plate-based bulk quant for 96-well reads. |
| [[greiner-black-96-well-fluorescence-plate]] | 655096 | ~50 plates | — | ORDER NEW | For PicoGreen reads. |
| [[thermo-slide-a-lyzer-g2-10k-mwco-cassettes]] | 87730 | 1 pack (3) | — | ORDER NEW | Tn5 dialysis into storage buffer. |
| [[thermo-dnase-i-rnase-free]] | EN0521 | 5 kU | 35 mL generic DNase | TOP UP | We have a generic DNase but not the RNase-free certified Thermo product specifically. |
| [[dna-lobind-tubes]] (1.5 mL Eppendorf) | 022431021 | 2 × 1000 pack | owned (qty unknown) | TOP UP | Check remaining count. |
| [[thermo-96-well-pcr-plate-semi-skirted]] | AB0900 | 10-pack (250 plates) | — | ORDER NEW | Tagmentation + PCR plates. |
| [[thermo-pcr-plate-foil-seals]] | AB0626 | 100-pack | — | ORDER NEW | Heat seals for PCR plates. |
| [[filter-tips-p10]] (Rainin 10 μL) | 17014961 | 10+ racks | card exists, no bottle logged | TOP UP | Confirm rack count before ordering; 2000 samples burns through tips fast. |
| [[filter-tips-p200]] (Rainin 200 μL) | 17014966 | 10+ racks | card exists, no bottle logged | TOP UP | Same — confirm and top up. |
| [[filter-tips-p1000]] (Rainin 1000 μL) | 17014967 | 10+ racks | card exists, no bottle logged | TOP UP | Same. |
| [[ampure-xp-beads]] | A63881 | 60 mL (optimization only) | owned (qty unknown) | TOP UP | Keep enough for optimization runs; switch to homemade SPRI at full scale. |
| [[roche-kapa-hifi-hotstart-readymix]] | KK2602 | 500 rxn | — | ORDER NEW | Library PCR amplification. Fisher sells KAPA; can also PrePurchase via Roche direct. |
| [[roche-kapa-library-quant-kit-qpcr]] | KK4824 | 500 rxn | — | ORDER NEW | Final library molarity before pooling. |
| [[bl21-de3-competent-cells]] fresh | NEB C2527H | 6 × 0.2 mL | glycerol stock only | TOP UP | Have a glycerol stock but fresh transformation-competent cells give better yields for Tn5 induction. |
| [[cytiva-sera-mag-speedbead-carboxyl]] | 65152105050250 | 15 mL | — | ORDER NEW | Raw bead for homemade SPRI (biggest consumable cost savings). |

### Bio-Rad (punch-out)

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[bio-rad-poly-prep-gravity-flow-columns]] | 7311550 | 100-pack | — | ORDER NEW | Chitin-resin gravity columns for Tn5 prep. |
| [[bio-rad-mini-protean-tgx-4-20]] precast gels | 4561094 | 10-pack | — | ORDER NEW | Tn5 purification SDS-PAGE QC. |
| [[bio-rad-sds-page-running-buffer]] | 1610772 | 1 L | — | ORDER NEW | Could also be made from SDS + Tris + glycine we already have. |
| [[bio-rad-laemmli-sample-buffer-2x]] | 1610737 | 30 mL | — | ORDER NEW | |
| [[bio-rad-precision-plus-protein-standards]] | 1610374 | 500 μL | — | ORDER NEW | 10-250 kDa ladder covers Tn5 at ~53 kDa. |

---

## PrePurchasing Orders (non-catalog vendors)

Each of these needs a quote PDF attached in PrePurchasing, then assigned to [[Susan Hendrickson]]. See [[Purchasing & Procurement#System 2 PrePurchasing non-catalog vendors]].

### IDT (oligos + UDI primers)

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[idt-tn5merev-oligo]] | custom, 250 nmol HPLC | 1 tube | — | ORDER NEW | 5' phosphate required. |
| [[idt-tn5me-a-oligo]] | custom, 250 nmol HPLC | 1 tube | — | ORDER NEW | |
| [[idt-tn5me-b-oligo]] | custom, 250 nmol HPLC | 1 tube | — | ORDER NEW | |
| [[idt-xgen-udi-primers-384]] | xGen or custom 384-UDI | 1 set | — | ORDER NEW | Decide xGen 96-plex vs custom 384-UDI with the IDT rep. |

### Addgene

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[addgene-ptxb1-tn5-plasmid]] | Addgene 60240 | 1 | — | ORDER NEW | Source plasmid for in-house Tn5. One-time purchase. |

### Diagenode

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[diagenode-tagmentase-loaded]] | C01070012 | 1 (500 rxn) | — | ORDER NEW | Preloaded Tn5 optimization control. |
| [[tn5-unloaded-blank]] | TBD (Diagenode C01070010 or NEB equivalent) | 1 tube | — | ORDER NEW | Unloaded Tn5 for custom adapter loading practice. |

### Illumina

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[illumina-tagment-dna-enzyme-tde1]] | 15027865 | 1 (96 rxn) | — | ORDER NEW | Second preloaded Tn5 control — independent vendor. |

### NEB (direct PrePurchasing if not routed via Fisher)

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[neb-chitin-resin]] | S6651 | 20 mL | — | ORDER NEW | Intein/CBD affinity step for Tn5 purification. |
| [[neb-q5-hotstart-polymerase]] | M0493 | 100 rxn | — | ORDER NEW | Backup polymerase. |

### Craig Ball Sales

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[chrome-steel-grinding-balls-5-32]] | bulk, 5/32" | 5000 | — | ORDER NEW | Grinding media for [[automill]]. |

### Epoch Life Science

| Item | Cat# | Need | On hand | Status | Notes |
|---|---|---|---|---|---|
| [[epoch-96-well-silica-filter-plate]] | 2060-050 | 10 plates | — | ORDER NEW | Backup extraction format / homebrew path. |

---

## Equipment

| Item | Status | Notes |
|---|---|---|
| [[automill]] | HAVE | Bead-mill tissue disrupter. Covers GenoGrinder / TissueLyser role — no grinder to buy. |
| [[centrifuge]] (plate-capable) | HAVE | Confirm 96-well plate rotor is available and whether it covers silica-plate washes. |
| [[magnetic-rack]] | HAVE | For AMPure / SPRI cleanups. |
| [[vacuum-manifold-96-well]] | DECIDE | Not in the lab. **Order only if the plate centrifuge doesn't handle the DNeasy 96 / Epoch silica wash step cleanly.** ~$900 via PrePurchasing. |
| TapeStation | SKIP | Not buying a TapeStation; HS D1000 reagents and screentape are therefore skipped (they'd be $800 of shelf-warmers). |
| GenoGrinder / TissueLyser | SKIP | [[automill]] covers this. |
| Probe sonicator | SKIP | Use a core facility for Tn5 lysis rather than purchase. |

---

## Budget rollup (order-of-magnitude)

| Bucket | Est. cost |
|---|---|
| Immediate Tn5 + adapters + ramp | ~$1,400 (Diagenode + TDE1 + IDT trio) |
| DNeasy 96 × 5–6 kits | ~$5,000 |
| Sigma chemicals + enzymes + protein-prep reagents (ORDER NEW lines only) | ~$2,000 |
| Fisher / Thermo consumables (tips, plates, seals, beads, QC kits) | ~$6,000 |
| Bio-Rad (SDS-PAGE + gravity columns) | ~$700 |
| IDT 384-UDI primer set (one-time) | ~$2,500 |
| NEB chitin + Q5 | ~$400 |
| Addgene pTXB1 + fresh BL21 | ~$270 |
| Craig Ball grinding balls | ~$150 |
| Epoch silica plates | ~$1,200 |
| Sera-Mag SPRI stock | ~$450 |
| Vacuum manifold (if approved) | ~$900 |
| **Total ballpark** | **~$21,000** |

Lines that drop off this total entirely because we already have the reagent: CTAB (~$180), PVP-40 (~$80), TAPS (~$120), NaCl (~$60), Triton X-100 (~$50), PEG 8000 (~$90), MgCl₂ (~$60) — roughly $650 saved by checking inventory first.

---

## Ordering workflow

1. **Decide on the vacuum manifold** before submitting the PrePurchasing batch — it adds ~$900 and may be unnecessary if the plate centrifuge covers the extraction protocol.
2. **Confirm DMF is actually in the chosen Tn5 protocol** ([[tn5-loading-library-prep]]) before adding DMF to the Sigma cart; DMF and DMSO are not interchangeable.
3. **Submit Aggie Enterprise punch-out carts first** (Sigma, Fisher, Bio-Rad) — one sitting, standard workflow, fast turnaround.
4. **Submit PrePurchasing requests** (IDT, Addgene, Diagenode, Illumina, NEB, Craig Ball, Epoch) with vendor quote PDFs attached. These take longer per vendor because each needs a separate quote-and-vendor-setup round.
5. **Ship to:** Grey Monroe Lab, 262 Robbins Hall, 150 California Ave, UC Davis, Davis CA 95616.

## Related

- [[low-pass-1000-sample-sequencing]]
- [[tn5-loading-library-prep]]
- [[Purchasing & Procurement]]
- [[Accounts Overview]]
