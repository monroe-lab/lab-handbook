---
type: protocol
title: "QIAGEN DNeasy Plant Extraction"
---

# QIAGEN DNeasy Plant Extraction

## Resources

**Equipment:** [[centrifuge|Microcentrifuge]], [[heat-block]] or [[water-bath]] (65C), [[vortex-mixer]]

**Reagents:** [[dneasy-plant-mini|QIAGEN DNeasy Plant Mini Kit]] (includes Buffers AP1, P3, AW1, AW2, AE, QIAshredder columns, DNeasy columns, collection tubes), [[rnase-aliquot|RNase A]]

**Consumables:** [[microtube]], [[ethanol-absolute]] (for buffer preparation)

**Related Protocols:** [[harvesting-leaf-tissue]], [[centrifuge-operation]], [[water-bath-and-heat-block]], [[quantifying-dna-qubit]]

**Prerequisites:** [[harvesting-leaf-tissue]], [[centrifuge-operation]], [[water-bath-and-heat-block]]

**Purpose:** Extract genomic DNA from plant tissue using a silica-column kit. Produces higher-purity DNA than the quick extraction (Buffer A) method, suitable for PCR, Sanger sequencing, and some library preps. Not optimized for high-molecular-weight (HMW) DNA needed for long-read sequencing.

## Time estimate

**Wall time:** ~2.5-3 hr | **Hands-on:** ~1 hr

---

## Before You Start

Check that you have sufficient stock of:

- [[dneasy-plant-mini|DNeasy Plant Mini Kit]] (check number of preps remaining)
- [[rnase-aliquot|RNase A]] (if not included in the kit version you have)
- [[ethanol-absolute|100% ethanol]] (needed to prepare Buffers AW1 and AW2 on first use; check if already prepared)

If anything is low, mark as needs-ordering in the [inventory system](../inventory-app/index.html).

**First time using the kit:** Follow the "Buffer Preparation" section in the kit handbook. Buffers AW1 and AW2 require addition of ethanol before first use. The kit handbook is in the box or available at [qiagen.com](https://www.qiagen.com).

## Background

The DNeasy kit uses a silica membrane in a spin column to bind DNA. The workflow is: lyse cells, remove debris, bind DNA to the column, wash away contaminants, elute pure DNA. This is faster and produces cleaner DNA than phenol:chloroform methods, at the cost of lower yield and shorter fragment lengths (typically <50 kb).

**When to use this vs. other methods:**

| Method | Quality | Fragment length | Yield | Best for |
|--------|---------|----------------|-------|----------|
| Quick extraction (Buffer A) | Crude | N/A (fragments) | Low | PCR genotyping only |
| **DNeasy (this protocol)** | **High purity** | **<50 kb** | **Moderate** | **PCR, Sanger, short-read sequencing** |
| HMW extraction | High purity | >50-100 kb | Variable | Long-read sequencing (Nanopore, PacBio) |

## Procedure

Follow the QIAGEN DNeasy Plant Mini Kit handbook. The steps below are a summary; refer to the handbook for exact volumes and centrifuge speeds.

### 1. Grind tissue

- Start with **50-100 mg** of flash-frozen leaf tissue (see [[harvesting-leaf-tissue]]).
- Grind to a fine powder using a [[automill|bead mill (TissueLyser)]] or [[mortar-and-pestle]] with [[liquid-nitrogen]].
- Transfer the powder to a 1.5 mL tube. Work quickly to prevent thawing.

### 2. Lyse

- Add **400 uL Buffer AP1** and **4 uL RNase A** (100 mg/mL stock).
- Vortex vigorously.
- Incubate at **65C for 10 minutes** in the heat block or water bath. Invert 2-3 times during incubation.

### 3. Precipitate proteins

- Add **130 uL Buffer P3**. Mix by inversion.
- Incubate on ice for **5 minutes**.

### 4. Clear the lysate

- Centrifuge at max speed for **5 minutes**.
- Transfer the supernatant to a QIAshredder column. Centrifuge **2 minutes**.
- Collect the flow-through. Avoid the pellet.

### 5. Bind DNA

- Add **1.5x volume of Buffer AW1** to the flow-through. Mix by pipetting.
- Transfer to a DNeasy column. Centrifuge **1 minute**. Discard flow-through.

### 6. Wash

- Add **500 uL Buffer AW2**. Centrifuge **1 minute**. Discard flow-through.
- Add **500 uL Buffer AW2** again. Centrifuge **2 minutes** to dry the membrane.
- Transfer the column to a new 1.5 mL tube.

### 7. Elute

- Add **50 uL Buffer AE** (pre-warmed to 65C) directly to the membrane. Incubate **5 minutes** at room temperature.
- Centrifuge **1 minute** to elute.
- **Optional second elution:** Add another 50 uL Buffer AE for higher total yield (but lower concentration).

### 8. QC

- Measure concentration with the [[qubit-fluorometer|DeNovix fluorometer]]. See [[quantifying-dna-qubit]].
- Expected yield: 1-10 ug from 100 mg of Arabidopsis leaf tissue.
- Store at **[[freezer-minus20|-20C]]** for long-term or **[[fridge-4c-main|4C]]** for short-term use.

## Troubleshooting

| Problem | Possible cause | Solution |
|---------|---------------|----------|
| Low yield | Not enough tissue, incomplete lysis, old/degraded tissue | Use more tissue (up to 100 mg), grind more thoroughly, use freshly frozen tissue |
| Low purity (260/280 < 1.7) | Protein carryover | Make sure QIAshredder step was done, repeat AW2 wash |
| Low 260/230 | Residual ethanol or salt | Centrifuge the dry spin (step 6) for 2 full minutes. Make sure the column membrane is not wet when eluting. |
| DNA too fragmented | Aggressive bead milling | Reduce grinding time or use mortar and pestle |

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Note: genotype, tissue amount, elution volume, Qubit concentration, total yield, storage location.

Create a new sample entry in the [inventory system](../inventory-app/index.html) for your DNA extract: note the sample ID, genotype, extraction method (DNeasy), concentration (ng/uL), elution volume, total yield, date, your initials, and storage location. Label the physical tube: `[genotype] gDNA / [concentration] ng/uL / [date] / [initials]`.
