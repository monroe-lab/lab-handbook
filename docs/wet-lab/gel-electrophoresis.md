# Gel Electrophoresis

**Purpose:** Separate PCR products by size to visualize genotyping results. DNA fragments migrate through an agarose matrix under an electric field — smaller fragments move faster, larger fragments move slower.

**Source:** [[Satoyo Oya]]'s Genotyping protocol ([Google Doc](https://docs.google.com/document/d/1Ntjr3jwrAEfu_PsRdqjOj0F_NCVHU1GqtIcL2dezXzI))

## Time estimate

**Wall time:** 40-70 min | **Hands-on:** ~10 min

```
|████████| Load samples into gel wells           5 min
|████| Start power supply                        1 min
|░░░░░░░░░░░░░░░░░░░░░░| Run gel               10-45 min (walk away)
|████| Transfer gel to stain                     1 min
|░░░░░░░░░░░░░░| Stain in SYBR Gold            10 min (walk away)
|████| Image on UV lamp                          3 min
```

---

## Background

**How it works:** Agarose forms a porous mesh when it solidifies. DNA is negatively charged (phosphate backbone), so it migrates toward the positive electrode when voltage is applied. Smaller DNA fragments snake through the pores faster than larger ones. After running, you stain the DNA with a fluorescent dye (SYBR Gold) and visualize under UV light — each fragment size appears as a discrete band.

**Agarose concentration controls resolution:**
- **0.8%** — good for large fragments (2-10 kb). Bands of similar size will be hard to resolve.
- **1.5%** — standard for genotyping (200 bp - 2 kb). Best resolution in the range where most PCR products fall.
- **2-3%** — for resolving small differences (<50 bp apart). Stiffer gel, slower migration.

For most genotyping, **1.5% agarose** is the default.

**Why SYBR Gold instead of ethidium bromide?** SYBR Gold is more sensitive (~25x) and less hazardous. EtBr is a suspected mutagen that requires special waste disposal. SYBR Gold degrades in light and is much safer, though you should still minimize skin contact.

**Why Emerald Amp has built-in loading dye:** The Emerald Amp master mix (TaKaRa) already contains a green loading dye with two tracking markers — a fast-migrating yellow dye and a slow-migrating blue dye. This means you can load PCR products directly onto the gel without adding separate loading buffer.

---

## Materials

- **Pre-cast 1.5% agarose gel** (available on open shelf above UV lamp) OR cast your own:
  - 1.5 g SeaKem or LE Agarose per 100 mL 1x TAE buffer
  - Microwave until dissolved, pour into casting tray with comb
- **1x TAE running buffer** (in gel tank)
- **1 kb+ Fast DNA Ladder** (size marker)
- **SYBR Gold stain bath** — in dark secondary container on shelf above UV lamp
  - If making fresh: 10 uL SYBR Gold concentrate + 100 mL 1x TAE
  - Aliquots in -30 C freezer, 2nd shelf
  - Working solution lasts ~1 week before degrading
- Gel tank (Mupid preferred for speed)
- Power supply
- UV transilluminator for imaging

## Procedure

1. Place gel in tank, submerge in **1x TAE buffer**
2. Load **~5 uL** of each PCR product into wells (1-2 uL for thin wells)
   - Emerald Amp products already have loading dye — load directly
3. Load **4 uL of 1 kb+ Fast Ladder** in at least one lane
4. Run at appropriate voltage:

| Gel tank | Voltage | Typical run time | Use case |
|----------|---------|-----------------|----------|
| **Mupid** (preferred) | 100 V | 10-30 min | Fast, clean. Use for <48 samples |
| Large tank | 135 V | 60+ min | Many samples |
| Small tank | 75 V | ~40 min | Backup |

**Rule of thumb:** Run until the yellow (fast) dye front is near the end of the gel.

5. **Stain:** Transfer gel to SYBR Gold bath, gently rock/shake for **10 min**
6. **Image:** Place gel on UV transilluminator, photograph

> *No bands at all (not even the ladder):* SYBR Gold is expired. Make a fresh stain solution from the -30 C freezer stock.

> *Smeared bands instead of discrete bands:* Too much DNA loaded (use less), voltage too high (reduce by 20%), or DNA is degraded.

> *Bands all at the same size:* Gel didn't run long enough to separate. Keep running, or use a higher percentage gel.

> *Gel melted during run:* Voltage too high for the buffer volume, or buffer level was too low. Reduce voltage, ensure gel is fully submerged.

---

## Reading genotyping gels

**T-DNA genotyping (3-primer PCR):**
- Wild-type: one band at ~900-1100 bp (LP+RP product)
- Heterozygous: two bands (LP+RP at ~900-1100 bp AND BP+RP at ~500-800 bp)
- Homozygous mutant: one band at ~500-800 bp (BP+RP product only)

**F1 hybrid confirmation (indel PCR):**
- Col-0 parent: one band at size X
- Kar-1 parent: one band at size Y (different from X)
- True F1 hybrid: **two bands** (both X and Y)
- Self (not a hybrid): one band only (matches one parent)

Always include parental controls on every gel so you know exactly where the bands should be.

---

## See also
- [[wet-lab/pcr-genotyping]]
- [[wet-lab/quick-dna-extraction]]
- [[lab-safety/Chemical Inventory]]
