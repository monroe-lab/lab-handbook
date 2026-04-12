---
type: protocol
title: "Make HiFi Lysis Buffer"
---

# Make HiFi Lysis Buffer

## Resources

**Equipment:** [[analytical-balance]], [[fume-hood]]

**Reagents:** PVP-40, [[sodium-metabisulfite]], [[sodium-chloride|NaCl]] (5 M stock), [[1m-tris-hcl-ph-8-8-5|Tris-HCl pH 8]] (1 M stock), [[edta-trisodium-salt|EDTA pH 8]] (0.5 M stock), [[2-mercaptoethanol|beta-mercaptoethanol]], [[sodium-dodecyl-sulfate|SDS]] (10% stock), molecular biology grade water

**Related Protocols:** [[hifi-dna-extraction]], [[how-to-use-the-scale]]

**Prerequisites:** [[how-to-use-the-scale]]

**Purpose:** Prepare the lysis buffer used in the [[hifi-dna-extraction|HiFi DNA Extraction]] protocol. This buffer must be made fresh on the day of extraction. The concept object [[hifi-lysis-buffer]] describes the buffer's composition and function.

## Time estimate

**Wall time:** ~15 min | **Hands-on:** ~15 min

---

## Before You Start

Check that you have sufficient stock of all reagents listed above. PVP-40 and sodium metabisulfite are powders stored at room temperature. The liquid stocks (NaCl, Tris-HCl, EDTA, SDS) should already be prepared. Beta-mercaptoethanol is in the [[cabinet-flammable]].

If anything is low, mark as needs-ordering in the [inventory system](../inventory-app/index.html).

**This buffer is made fresh every time.** Do not use buffer from a previous day.

## Recipe: 10 mL

| Reagent | Stock | Amount | Final concentration |
|---------|-------|--------|-------------------|
| PVP-40 | powder | 0.1 g | 1% (w/v) |
| Sodium metabisulfite | powder | 0.1 g | 1% (w/v) |
| NaCl | 5 M | 1 mL | 0.5 M |
| Tris-HCl pH 8 | 1 M | 1 mL | 100 mM |
| EDTA pH 8 | 0.5 M | 1 mL | 50 mM |
| Beta-mercaptoethanol | neat | 200 uL | 2% (v/v) |
| SDS | 10% | 1.5 mL | 1.5% |
| Water (mol. biol. grade) | | to 10 mL | |

Scale up proportionally if extracting many samples (each sample uses ~600 uL).

## Procedure

**Work in the [[fume-hood]].** Beta-mercaptoethanol has an extremely strong odor and is toxic.

1. In a 50 mL tube, combine the liquid stocks first: **1 mL Tris-HCl**, **1 mL EDTA**, **1 mL NaCl**, and water to approximately 6 mL.
2. Weigh **0.1 g PVP-40** and **0.1 g sodium metabisulfite** on the [[analytical-balance]]. Add both powders to the tube.
3. Vortex or swirl to dissolve. PVP-40 can be slow to dissolve.
4. In the fume hood, add **200 uL beta-mercaptoethanol**. Mix.
5. **Add 1.5 mL of 10% SDS last.** Adding SDS earlier can cause precipitation at lower temperatures. Invert gently to mix (do not vortex vigorously after adding SDS; it foams).
6. Bring total volume to **10 mL** with water.
7. **Pre-heat to 55C** before use (dissolves the PVP fully and is the working temperature for the lysis step in [[hifi-dna-extraction]]).

<!-- PHOTO: Lysis buffer in a 50 mL tube, pre-heated, ready for extraction -->

## Labeling

This buffer is used immediately and discarded after extraction. No long-term label needed. If you pre-mix the base solution (step 1 only — water, Tris, EDTA, NaCl without the fresh reagents), label it: `HiFi Lysis Base (no PVP/BME/SDS) / [date] / [initials]`.

## Documentation

No separate inventory entry needed (this is a single-use reagent). Note in your lab notebook that you made fresh lysis buffer as part of the [[hifi-dna-extraction]] protocol entry.
