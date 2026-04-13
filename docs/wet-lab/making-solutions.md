---
title: "Making Solutions"
type: "protocol"
---

# Making Solutions

**Purpose:** Learn how to calculate, prepare, and dilute solutions correctly. This is a core reference for anyone making buffers, media, or reagents in the lab.

**Related Protocols:** [[make-tae-buffer]], [[make-te-buffer]], [[make-buffer-a]], [[make-hifi-lysis-buffer]], [[ms-media-recipe]], [[ph-measurement]], [[how-to-use-the-scale]]

---

## What Is a Stock Solution?

A **stock solution** is a concentrated solution that you dilute to a **working concentration** before use. We make stock solutions because:

- **Convenience:** Make it once, dilute many times. A bottle of 10X TAE buffer on the shelf saves you from weighing Tris every time you run a gel.
- **Accuracy:** It is easier to weigh 121.1 g of Tris than 12.1 g ten separate times. One careful preparation beats ten rushed ones.
- **Stability:** Many reagents are more stable at higher concentrations.

Stock concentrations are written with an "X" multiplier. **10X** means ten times the working concentration. **1000X** means you add 1 uL per mL of final solution.

---

## Key Formulas

### The Dilution Equation: C1V1 = C2V2

This is the single most important equation in solution prep. It tells you how much stock to use when diluting.

$$
C_1 V_1 = C_2 V_2
$$

| Variable | Meaning |
|----------|---------|
| C1 | Concentration of the stock solution |
| V1 | Volume of stock you need (what you are solving for) |
| C2 | Desired final concentration |
| V2 | Desired final volume |

Rearranged: **V1 = (C2 x V2) / C1**

### Molarity: Grams Needed for a Molar Solution

$$
\text{mass (g)} = \text{Molarity (mol/L)} \times \text{Volume (L)} \times \text{Molecular Weight (g/mol)}
$$

Look up the molecular weight (MW) on the reagent bottle or the SDS.

### Percent Solutions

| Type | Definition | Example |
|------|-----------|---------|
| **% w/v** (weight/volume) | Grams of solute per 100 mL of solution | 10% w/v NaCl = 10 g NaCl in 100 mL total |
| **% v/v** (volume/volume) | mL of liquid solute per 100 mL of solution | 70% v/v ethanol = 70 mL ethanol + 30 mL water |

---

## Worked Examples

### Example 1: Making 500 mL of 1M NaCl from powder

NaCl molecular weight = 58.44 g/mol.

$$
\text{mass} = 1 \text{ mol/L} \times 0.5 \text{ L} \times 58.44 \text{ g/mol} = 29.22 \text{ g}
$$

**Steps:**

1. Weigh **29.22 g NaCl** on the balance.
2. Add to a beaker with ~400 mL of distilled water (not the full 500 mL yet).
3. Stir until dissolved.
4. Transfer to a graduated cylinder or volumetric flask and bring to **500 mL** with distilled water.
5. Mix, label, and store.

### Example 2: Diluting 10X buffer to 1X

You need 200 mL of 1X TAE buffer from a 10X stock.

$$
V_1 = \frac{C_2 \times V_2}{C_1} = \frac{1 \times 200}{10} = 20 \text{ mL}
$$

**Steps:**

1. Measure **20 mL** of 10X TAE with a graduated cylinder.
2. Add to a container with **180 mL** of distilled water.
3. Mix. Done.

### Example 3: Making 100 mL of 70% ethanol from 95% ethanol

$$
V_1 = \frac{70 \times 100}{95} = 73.7 \text{ mL}
$$

**Steps:**

1. Measure **73.7 mL** of 95% ethanol.
2. Add distilled water to bring total volume to **100 mL**.
3. Mix. Label the bottle "70% EtOH" with the date.

---

## Mixing Principles

### Order of operations matters

!!! danger "Always add acid to water, never water to acid"
    Adding water to concentrated acid causes a violent exothermic reaction that can splash concentrated acid out of the container. Always start with water in your vessel, then slowly add acid while stirring. The mnemonic: **"Do as you oughta, add acid to water."**

**General rule:** Add solute (powder or concentrated liquid) to solvent (water), not the other way around. This ensures even dissolution and avoids dangerous reactions.

### Dissolving solutes

- Use a **magnetic stir bar and stir plate** for any solution that takes more than a few seconds of swirling.
- Some common solutes need **heat** to dissolve:
    - **Agarose** (for gels): dissolves only in boiling liquid (microwave or hot plate).
    - **SDS** (sodium dodecyl sulfate): dissolves much faster with gentle warming to ~40 C. Do not overheat.
    - **PEG** (polyethylene glycol): viscous and slow to dissolve at room temperature. Warm gently.
    - **Agar** (for plates): requires autoclaving or boiling.
- If a powder is clumping, add it slowly while stirring instead of dumping it all at once.

### pH adjustment

- Add acid (HCl) or base (NaOH) **slowly, in small increments** while stirring.
- Use a **calibrated pH meter**, not pH strips, for anything where the pH matters (e.g., Tris buffers). See [[ph-measurement]].
- Tris buffers are temperature-sensitive: pH measured at room temperature will be ~0.03 units lower per degree C at 37 C. Adjust pH at the temperature the buffer will be used.

### Bring to final volume last

!!! warning "Do not add the full volume of water up front"
    Dissolving solute changes the total volume. Adding pH-adjusting reagents also adds volume. Always dissolve your solute in **80-90%** of the target volume, adjust pH if needed, then bring to the final volume using a graduated cylinder or volumetric flask.

---

## Measurement Tips

### Choosing the right tool

Accuracy depends on using the right measuring device. Here they are from **most to least accurate**:

| Device | Best for | Accuracy |
|--------|----------|----------|
| **Analytical balance** (4-decimal) | Solids < 1 g | +/- 0.0001 g |
| **Top-loading balance** (2-decimal) | Solids 1 g to 500 g | +/- 0.01 g |
| **Volumetric flask** | Final volume for precise solutions | +/- 0.1% |
| **Graduated cylinder** | Measuring 10-1000 mL | +/- 1% |
| **Serological pipette** | Measuring 1-50 mL | +/- 1-2% |
| **Micropipette** | Measuring 0.1 uL to 1000 uL | +/- 0.5-2% |
| **Beaker markings** | Rough estimates only | +/- 5-10% |

**Rules of thumb:**

- For anything under 1 g, use the 4-decimal **analytical balance** (the one behind the glass doors). See [[how-to-use-the-scale]].
- For bringing solutions to final volume when precision matters (standards, calibration solutions), use a **volumetric flask**.
- For routine buffers and media, a **graduated cylinder** is fine.
- **Never trust beaker markings** for anything that matters. They are approximate.
- For volumes between 1 and 50 mL, **serological pipettes** (the long disposable ones used with the pipette gun) are more accurate than pouring from a graduated cylinder.
- For volumes under 1 mL, use a **micropipette**. See [[pipette-school]].

### Weighing tips

- **Tare the container** before adding reagent. Place your weigh boat or beaker on the balance and press "tare" or "zero."
- Use a **weigh boat** or **weigh paper** for powders. Never pour chemicals directly onto the balance pan.
- Close the glass doors on the analytical balance before reading. Air currents affect the measurement.
- For hygroscopic chemicals (ones that absorb water from the air, like NaOH pellets), work quickly and keep the bottle closed between scoops.

---

## Quick Reference Table

| Solution | Formula | Amount for target |
|----------|---------|-------------------|
| 1M NaCl (500 mL) | MW = 58.44 | 29.22 g in 500 mL |
| 0.5M EDTA pH 8.0 (500 mL) | MW = 372.24 | 93.06 g in 500 mL, pH with NaOH |
| 1M Tris-HCl pH 8.0 (1 L) | MW = 121.14 | 121.14 g in 1 L, pH with HCl |
| 10% SDS (100 mL) | w/v | 10 g in 100 mL, warm to dissolve |
| 5M NaCl (100 mL) | MW = 58.44 | 29.22 g in 100 mL |
| 70% ethanol (1 L) | v/v from 95% | 737 mL of 95% EtOH + water to 1 L |
| 10X PBS (1 L) | standard recipe | 80 g NaCl, 2 g KCl, 14.4 g Na2HPO4, 2.4 g KH2PO4 |

!!! tip "Label everything"
    Every solution you make gets a label with: **solution name and concentration, date prepared, your initials, and any relevant notes** (pH, storage temperature). Unlabeled bottles get discarded.
