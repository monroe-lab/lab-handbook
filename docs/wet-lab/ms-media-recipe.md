# MS Media Recipe

**Purpose:** Murashige & Skoog agar plates for Arabidopsis seed germination and seedling growth.

**Source:** Satoyo Oya's lab recipe; also in [Recipes doc](https://docs.google.com/document/d/1um8iG9L81WxicA_Ez5yNWPw1V0Uhwa0yoWsYKIMmloY)

---

## Background

**MS media** (Murashige & Skoog, 1962) is the standard plant tissue culture medium. The basal salt mixture is a premixed powder containing macro- and micronutrients that plants need to grow in vitro — nitrogen (as NH4NO3 and KNO3), phosphorus, potassium, calcium, magnesium, sulfur, plus trace amounts of iron, manganese, zinc, boron, copper, cobalt, iodine, and molybdenum. It also contains B vitamins (thiamine, pyridoxine, nicotinic acid) and myo-inositol. The idea is to replace everything that soil and associated microbes would normally provide.

**What each component does:**

| Component | Role |
|-----------|------|
| **MS basal salt** | Complete mineral nutrition. The 4.4 g/L formulation includes vitamins (sometimes sold separately — check the label). |
| **MES buffer** | Maintains pH during autoclaving and plant growth. Plant roots acidify the medium as they take up NH4+, so buffering matters. pH 5.8 is optimal for nutrient uptake in most plants. |
| **Sucrose** | Carbon/energy source. Plants on plates are often in low light or have small cotyledons, so they're partially heterotrophic early on. Higher sucrose (10 g/L) supports faster growth but also feeds contaminants. |
| **TC Agar** | Gelling agent. Tissue culture grade agar (A175) is purified to remove inhibitory compounds present in cheaper agars. Regular bacteriological agar can work for simple seed germination but may affect sensitive assays. |
| **KOH** | pH adjustment. MS salts dissolve to ~pH 4-5. KOH brings it to 5.8 without adding unwanted ions (Na from NaOH can inhibit some plants at high concentrations). |

**Why pH 5.8?** Plant cell membranes have H+-ATPases that pump protons out, and nutrient transporters are optimized around mildly acidic conditions. Too low (<5) and aluminum/manganese become toxic; too high (>6.5) and iron/zinc precipitate out of solution.

### Variants

- **Standard (10 g sucrose + 8 g agar):** Softer plates, better for root growth and observation. Use when contamination risk is low (sterilization was thorough, working in clean bench).
- **Low-contamination (5 g sucrose + 9 g agar):** Firmer plates, less sugar starves fungal contaminants. Use when plating many seeds or if you've had contamination problems.
- **Half-MS:** Some protocols use 2.2 g/L MS salt (half-strength). Common for root growth assays where full-strength nitrogen can inhibit lateral root formation. Not needed for basic germination.
- **No-sucrose:** Forces seedlings to photosynthesize. Used for some physiological assays. Slower growth.

---

## Time estimate

**Wall time:** ~2 hours | **Hands-on:** ~40 min

```
|████████| Weigh and dissolve reagents    15 min
|████| pH adjustment                      10 min
|██| Add agar, cover with foil             5 min
|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| Autoclave  60-90 min (walk away)
|░░░░| Cool to ~55 C                      15 min (nearby, check occasionally)
|████████| Pour plates in clean bench     15 min
|░░░░| Solidify                           20 min (walk away)
```

---

## Standard Recipe (1 L)

| Component | Amount | Notes |
|-----------|--------|-------|
| MS basal salt mixture | 4.4 g | Murashige & Skoog, premixed powder |
| MES buffer | 0.5 g | |
| Sucrose | 10 g | Default; use 5 g for low-contamination variant |
| TC Agar (A175) | 8 g | Default; use 9 g for firmer plates |
| dH2O | to 1 L | |

## Scaled-down Recipe (250 mL)

| Component | Amount |
|-----------|--------|
| MS basal salt mixture | 1.1 g |
| MES buffer | 0.125 g |
| Sucrose | 2.5 g |
| TC Agar | 2 g |
| dH2O | to 250 mL |

---

## Procedure

1. Add MS salt, MES, and sucrose to an Erlenmeyer flask
2. Add dH2O to volume and dissolve by swirling or with magnetic stir bar
3. **Adjust pH to 5.8** with KOH:
   - Add ~100 uL of 5N KOH
   - Fine-adjust with 0.5N KOH (typically 150-300 uL)
   - Check with pH meter or pH strips
4. Add agar and swirl (it won't fully dissolve until autoclaved — that's fine)
5. Leave the magnetic stir bar in the flask
6. Cover flask mouth loosely with foil
7. [[autoclave]] at 121 C for 30 min
8. After autoclaving, swirl gently to distribute agar evenly
9. Cool to ~55-60 C (warm to touch but not hot)
10. Pour plates in [[clean-bench|clean bench]], ~25 mL per 100 mm plate
11. **Yield:** 1 L makes ~15-20 plates

> *If plates have bubbles:* You poured too hot or swirled too vigorously. Let the flask cool a bit more next time. You can pop surface bubbles with a sterile pipette tip.

> *If agar doesn't solidify:* You may have used too little agar, or it degraded. Agar loses gelling strength if autoclaved repeatedly or stored improperly.

> *If pH drifts during autoclaving:* Normal — MES buffer limits this. If plates look yellow/brown, the pH was too high before autoclaving (caramelization of sucrose at high pH). Re-make with more careful pH adjustment.

---

## Storage

- Poured plates can be stored inverted at 4 C for 2-4 weeks
- Wrap in plastic sleeve or bag to prevent drying out
- Discard if contamination spots appear

---

## Reagent locations
- MS salt: check [[lab-safety/Chemical Inventory]] — **currently not listed, may need to order**
- MES: check [[lab-safety/Chemical Inventory]] — 50 g in Chemical Cabinet
- TC Agar (A175): check [[lab-safety/Chemical Inventory]] — only 25 g TC grade; 450 g regular agar also available
- KOH stocks: check [[lab-safety/Chemical Inventory]] — only 400 mg solid listed, need pre-made solutions

## See also
- [[wet-lab/planting-arabidopsis-on-ms-plates]]
- [[wet-lab/autoclave]]
- [[wet-lab/clean-bench]]
- [[lab-safety/Chemical Inventory]]
