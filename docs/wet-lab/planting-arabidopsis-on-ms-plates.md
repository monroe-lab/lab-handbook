# Planting Arabidopsis Seeds on MS Plates

**Purpose:** Sterilize seeds, prepare MS agar plates, and sow seeds for germination under sterile conditions.

**Source:** Adapted from Satoyo Oya's protocols on Google Drive ([Making MS plate and planting A.thliana seeds](https://docs.google.com/document/d/107eRSRvcNR1QXutD8OpxPUiafcXnMEGLFfiNlwrFDcQ), [Forward Genetic Screening](https://docs.google.com/document/d/1mn61xigAIb3mNqinvhqoZ8evXT8MCpY7s5X6ucObXFU), [Lily's M2 Fwd genetic screening protocol](https://docs.google.com/document/d/1YQmUc_6k04CSZKqEYtecOZi9G54wUs28ohaQ32FD6Rc))

**Timeline:** Start 2 days before you want seeds on plates (Day -2: sterilize + stratify, Day 0: plate).

## Time estimate

**Total wall time:** 3 days (2 days stratification + 1 day plating)
**Total hands-on time:** ~2.5 hours across all days

### Day -2: Seed sterilization + stratification (~30 min hands-on)
```
|████| Aliquot seeds into tubes           5 min
|████| Add EtOH, load on rotator          5 min
|░░░░░░░░░░░░░░░░░░| Rotating            15 min (walk away)
|████| Remove EtOH, resuspend, foil, fridge  5 min
```

### Day -1 or Day 0: Make MS plates (~1.5 hr hands-on)
```
|████████| Weigh reagents, dissolve, pH   20 min
|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| Autoclave  60-90 min (walk away)
|████| Wait for cooling                   15 min (nearby but idle)
|████████| Pour plates in clean bench     20 min
|░░░░| Plates solidify                    20 min (walk away)
```

### Day 0: Plating seeds (~30 min hands-on)
```
|████| Set up clean bench, spray, arrange 10 min
|████████| Plate seeds (4 genotypes)      20 min
|████| Seal, label, move to growth chamber 5 min
```

**Key gaps you can use:** The autoclave step (60-90 min) and stratification (2 full days) are completely free time. The actual hands-on work is short bursts.

---

## Materials

### Reagents
- [[ms-media-recipe|MS salt]] (Murashige & Skoog basal salt mixture, 4.4 g/L)
- [[MES buffer]] (2-(N-morpholino)ethanesulfonic acid, 0.5 g/L)
- Sucrose (5 or 10 g/L; see [[ms-media-recipe]] for which to use)
- [[TC Agar]] (tissue culture grade agar, A175; 8 or 9 g/L)
- KOH for pH adjustment (5N stock + 0.5N stock)
- 70% ethanol OR [[seed-sterilization|bleach sterilization solution]]
- Sterile distilled water
- 0.1% agar solution (for seed resuspension; sterilized)

### Equipment
- [[autoclave]] (121 C, 30 min cycle)
- [[clean-bench|Laminar flow clean bench]]
- Sterile petri dishes (100 mm)
- Magnetic stir bar
- 1 mL pipette tips (for seed placement)
- Surgical tape (Micropore) for sealing plates
- Tube rotator (for seed sterilization)
- pH meter or pH strips

### Seeds for this project
- **Col-0** (reference parent)
- **Kar-1** (ID 763, Talia Temp 3) — primary cross ecotype
- **IP-Vid-1** (ID 9512, Talia Temp 2) — backup 1
- **Dja-1** (ID 766, Talia Temp 3) — backup 2

---

## Procedure

### Day -2: Seed Sterilization + Stratification

1. Aliquot seeds into 1.5 mL tubes (one tube per genotype)
2. Sterilize seeds using one of the methods in [[seed-sterilization]]:
   - **Small batches (<200 seeds):** 70% EtOH, rotate 10-15 min, then dry in [[clean-bench|clean bench]]
   - **Larger batches:** Bleach/Triton solution, rotate 5 min wash + 15 min wash, rinse 3x with sterile water
3. Resuspend sterilized seeds in 1 mL sterile water
4. Wrap tubes in foil, place in **4 C fridge for 2 days** (stratification — breaks dormancy, synchronizes germination)

### Day -1 or Day 0: Make MS Plates

1. Prepare MS media following [[ms-media-recipe]] (1 L batch makes ~15-20 plates)
2. [[autoclave]] the media (121 C, 30 min; leave stir bar in flask)
3. After autoclaving, let media cool to ~55-60 C (touchable but still liquid)
4. In the [[clean-bench|clean bench]], pour ~25 mL per plate
5. Leave lids slightly ajar until agar solidifies (~20-30 min)
6. Close lids, store plates inverted at room temp or 4 C until use

### Day 0: Plating Seeds

1. Work in the [[clean-bench|clean bench]]
2. Remove seeds from fridge (end of stratification)
3. Resuspend seeds in sterile 0.1% agar solution (helps seeds stick to tip and release onto plate)
4. Using a 1 mL pipette tip, touch the agar surface — one touch releases approximately one seed
5. Space seeds ~1 cm apart on the plate
6. Seal plates with surgical tape (Micropore — allows gas exchange)
7. Place plates **face up** in growth chamber or incubator
   - Long day conditions (16h light / 8h dark)
   - 22 C

### Post-plating

- **Day 2-3:** Expect radicle emergence
- **Day 5-7:** Cotyledons should be fully expanded
- **Day 10-14:** True leaves appearing — seedlings ready for transplant to soil if desired

---

## Notes

- Default MS recipe: sucrose 10 g/L + agar 8 g/L. Use sucrose 5 g/L + agar 9 g/L when contamination risk is higher (firmer plates inhibit fungal spread).
- For this project, plate Col-0 and all three candidate ecotypes (Kar-1, IP-Vid-1, Dja-1) simultaneously — this tests germination of all candidates at once.
- Also plant a set directly in [[planting-in-soil|soil]] as backup and to learn both methods.
- Label plates clearly: genotype, date, your initials.

---

## See also
- [[wet-lab/seed-sterilization]]
- [[wet-lab/ms-media-recipe]]
- [[wet-lab/autoclave]]
- [[wet-lab/clean-bench]]
- [[wet-lab/planting-in-soil]]
- [[wet-lab/stratification]]
- [[lab-safety/Chemical Inventory]]
- [[Controlled Environment Facility]]
- [[Satoyo Oya]] — source of original protocols
- [[Lily Tan]] — currently doing this workflow for X-ray experiments
