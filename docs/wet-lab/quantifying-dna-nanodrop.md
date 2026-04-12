---
type: protocol
title: "Quantifying DNA: NanoDrop"
---

# Quantifying DNA: NanoDrop

## Resources

**Equipment:** NanoDrop spectrophotometer (**needs ordering; not yet in the lab**)

**Reagents:** Nuclease-free water or TE buffer (for blanking)

**Related Protocols:** [[quantifying-dna-qubit]], [[quick-dna-extraction]], [[qiagen-dneasy-extraction]]

**Prerequisites:** A DNA sample from any extraction protocol

**Purpose:** Measure DNA concentration and purity using UV absorbance. Fast (2 uL per reading, no incubation), but less accurate than fluorometric methods (Qubit) because contaminants also absorb at 260 nm.

## Time estimate

**Wall time:** ~10 min | **Hands-on:** ~10 min

---

## When to Use NanoDrop vs. Qubit

| | NanoDrop | Qubit (DeNovix) |
|---|---------|------|
| **Measures** | Total UV-absorbing material at 260 nm | dsDNA specifically (fluorescent dye) |
| **Accuracy** | Overestimates if RNA, protein, or phenol present | Accurate for dsDNA regardless of contaminants |
| **Purity info** | Yes (260/280 and 260/230 ratios) | No |
| **Speed** | Very fast, no reagent prep | ~5 min incubation, requires working solution |
| **Sample volume** | 1-2 uL | 1-20 uL |
| **Best for** | Quick purity check, high-concentration samples | Accurate quantification for library prep, sequencing submission |

**Use both when it matters.** NanoDrop tells you if the sample is clean (260/280 and 260/230). Qubit tells you how much actual dsDNA you have. For sequencing library prep, always use Qubit for concentration and NanoDrop for purity.

## Background

DNA absorbs ultraviolet light at 260 nm. The NanoDrop measures this absorbance and converts it to concentration using Beer's Law (A = e * c * l, where e is the extinction coefficient for dsDNA: 50 ng/uL per absorbance unit at 260 nm).

### Purity ratios

**A260/A280 ratio:**
- Pure DNA: ~1.8
- Pure RNA: ~2.0
- Low ratio (<1.6): protein or phenol contamination
- High ratio (>2.0): RNA contamination

**A260/A230 ratio:**
- Pure nucleic acid: 2.0-2.2
- Low ratio (<1.5): carbohydrate, salt, or organic solvent contamination (common culprits: guanidinium salts from kits, ethanol carryover, EDTA)

## Procedure

1. Clean the pedestal with a lint-free wipe.
2. Pipette **1-2 uL of blank** (nuclease-free water or TE, whichever your DNA is dissolved in) onto the pedestal. Close the arm. Blank the instrument.
3. Wipe the pedestal clean.
4. Pipette **1-2 uL of your sample** onto the pedestal. Close the arm. Measure.
5. Record: concentration (ng/uL), A260/A280, A260/A230.
6. Wipe the pedestal clean between samples.
7. When finished, wipe the pedestal with water and then dry.

## Interpreting Results

| Result | Meaning | Action |
|--------|---------|--------|
| 260/280 = 1.7-1.9 | Clean DNA | Good to go |
| 260/280 < 1.6 | Protein or phenol contamination | Consider re-purification (SPRI beads or column cleanup) |
| 260/280 > 2.0 | Possible RNA contamination | RNase treatment if needed for downstream application |
| 260/230 < 1.5 | Salt, carbohydrate, or solvent contamination | Often from kit elution buffers. May need ethanol precipitation or bead cleanup. |
| Concentration very different from Qubit | Contaminants inflating the NanoDrop reading | Trust the Qubit number for actual dsDNA concentration |

## Documentation

Add NanoDrop readings to the same lab notebook table as your Qubit results:

| Sample | Concentration (ng/uL) | A260/A280 | A260/A230 | Notes |
|--------|----------------------|-----------|-----------|-------|
