---
type: protocol
title: "Quantifying DNA: DeNovix Fluorometer"
---

# Quantifying DNA: DeNovix Fluorometer

## Resources

**Equipment:** DeNovix fluorometer (bench area, Robbins 170)

**Reagents:** Qubit dsDNA BR (Broad Range) Assay Kit or Qubit dsDNA HS (High Sensitivity) Assay Kit, Qubit assay tubes (0.5 mL thin-wall)

**Related Protocols:** [[quick-dna-extraction]], [[qiagen-dneasy-extraction]], [[nanopore-rapid-library-prep]]

**Prerequisites:** A DNA sample from any extraction protocol

**Purpose:** Accurately measure DNA concentration using fluorescence. This is more accurate than spectrophotometric methods (NanoDrop) because the dye binds specifically to double-stranded DNA, ignoring RNA, free nucleotides, and protein contaminants that inflate UV absorbance readings.

## Time estimate

**Wall time:** ~30-45 min (including standards) | **Hands-on:** ~20 min

---

## Before You Start

Check that you have sufficient stock of:

- Qubit dsDNA BR Kit **or** HS Kit (choose based on expected concentration; see table below)
- Qubit assay tubes (thin-wall 0.5 mL, NOT regular microcentrifuge tubes)

If supplies are low, mark as needs-ordering in the [inventory system](../inventory-app/index.html).

### Which kit to use

| Kit | Detection range | Use when |
|-----|----------------|----------|
| **BR (Broad Range)** | 2-1,000 ng/uL (in the assay tube) | Most routine measurements: post-extraction QC, pre-library-prep quantification |
| **HS (High Sensitivity)** | 0.005-120 ng/uL (in the assay tube) | Low-concentration samples: elutions from cleanup, diluted libraries |

When in doubt, start with BR. If the reading says "too low," switch to HS.

## Background

The Qubit assay works by mixing your DNA sample with a fluorescent dye that only fluoresces when bound to double-stranded DNA. The instrument excites the dye and measures the fluorescence intensity, comparing it to two standards of known concentration to calculate the DNA concentration in your sample.

**Why fluorometry over UV absorbance:** A NanoDrop measures absorbance at 260 nm, which is where DNA absorbs. But RNA, free nucleotides, proteins with aromatic residues, and phenol contamination also absorb at 260 nm. The result is often an overestimate. The Qubit dye is specific to dsDNA, giving you the true DNA concentration.

## Procedure

### 1. Prepare the working solution

1. Set up enough tubes for your samples + 2 standards.
2. The working solution is: Qubit dye reagent diluted in Qubit buffer. The ratio is **1 uL dye per 199 uL buffer** (1:200 dilution).
3. Calculate total volume needed: (number of samples + 2 standards) x 200 uL.
4. Mix the working solution in a clean tube. Vortex briefly.

### 2. Prepare standards

1. Label two Qubit assay tubes: **S1** and **S2**.
2. Add **190 uL** of working solution to each.
3. Add **10 uL** of Standard 1 to S1. Add **10 uL** of Standard 2 to S2.
4. Vortex 2-3 seconds. Pulse spin.

### 3. Prepare samples

1. Label a Qubit assay tube for each sample.
2. Add **198 uL** of working solution to each sample tube (for a 2 uL sample input).
3. Add **2 uL** of your DNA sample. (You can use 1-20 uL of sample, adjusting the working solution volume so the total is always 200 uL. 2 uL is standard.)
4. Vortex 2-3 seconds. Pulse spin.

### 4. Incubate

Let all tubes (standards and samples) sit at room temperature for **2 minutes**. This allows the dye to bind fully.

### 5. Read

1. On the DeNovix, select the Qubit dsDNA assay (BR or HS, matching your kit).
2. Read Standard 1 first, then Standard 2. The instrument stores the calibration.
3. Read each sample tube. Record the concentration displayed.

**Important:** The instrument reports the concentration **in the assay tube** (ng/mL). It also calculates the **original sample concentration** (ng/uL) based on your input volume. Make sure you are recording the right number. You want the original sample concentration.

### 6. Interpret

| Result | Meaning | Action |
|--------|---------|--------|
| Within range | Good measurement | Record it |
| "Too high" | Concentration exceeds the kit range | Dilute your sample and re-measure, or switch from HS to BR |
| "Too low" | Below detection limit | Switch from BR to HS, or your extraction yielded very little DNA |
| Standards fail | Reagents may be expired or contaminated | Use fresh working solution, check kit expiration |

## Tips

- Qubit assay tubes are specific. Regular microcentrifuge tubes are too thick and interfere with fluorescence measurement.
- The working solution is light-sensitive. Work reasonably quickly. Do not leave tubes in direct sunlight.
- Standards should be run fresh each session (or at least daily).
- You only need 2 uL of sample, so this is very economical with precious DNA.

## Documentation

Create a lab notebook entry for the extraction that produced the DNA. Add a row to a table:

| Sample | Extraction method | Qubit kit | Concentration (ng/uL) | Total yield (ng) | Date |
|--------|------------------|-----------|----------------------|-------------------|------|

Total yield = concentration x elution volume (e.g., 42 ng/uL x 50 uL = 2,100 ng = 2.1 ug).
