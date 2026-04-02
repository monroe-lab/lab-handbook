# PCR Genotyping

**Purpose:** Amplify a specific DNA region to determine genotype — is this plant a homozygote, heterozygote, or wild-type? Used for T-DNA insertion line validation and F1 hybrid confirmation.

**Source:** [[Satoyo Oya]]'s Genotyping protocol ([Google Doc](https://docs.google.com/document/d/1Ntjr3jwrAEfu_PsRdqjOj0F_NCVHU1GqtIcL2dezXzI)), T-DNA ordering/validation ([Google Doc](https://docs.google.com/document/d/1kJAXfBDfsHfSId-Rf-AxohcZjKdL3aStNkeIJpJ0WPU))

## Time estimate

**Wall time:** ~2 hours | **Hands-on:** ~30 min

```
|████████| Set up master mix on ice              10 min
|████████| Aliquot into tubes, add template      10 min
|████| Load thermocycler, start program           2 min
|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| Thermocycler running  70-90 min (walk away)
|████| Transfer to gel                            5 min
```

Then continue to [[wet-lab/gel-electrophoresis]] (~40-60 min, mostly waiting).

**Full genotyping pipeline (extraction → PCR → gel):**
```
|████████████| Quick DNA extraction        15 min
|████████████████████| PCR setup + run     10 min active + 80 min waiting
|████████████████| Gel run + image         10 min active + 40 min waiting
                                           TOTAL: ~2.5 hr wall, ~45 min hands-on
```

---

## Background

**How genotyping PCR works:** You design primers that flank a region of interest. When you run PCR, the primers bind to complementary sequences in the template DNA and Taq polymerase extends them, doubling the target region every cycle. After 38 cycles, you have billions of copies of that region — enough to see as a bright band on a gel.

**For T-DNA insertion lines (SALK lines):** You use a 3-primer strategy:
- **LP** (Left Primer) + **RP** (Right Primer): flank the insertion site. In wild-type, these amplify a band (~900-1100 bp). If a T-DNA is inserted between them, the insert is too large (~5-10 kb) for standard PCR to amplify, so you get no band.
- **BP** (Border Primer): sits on the T-DNA itself. BP + RP (or LP) amplifies only if the T-DNA is present — gives a band (~500-800 bp).
- **Wild-type:** LP+RP band only. **Heterozygous:** both bands. **Homozygous mutant:** BP+RP band only.

**For F1 hybrid confirmation (Col-0 × Kar-1):** Design primers flanking an indel where the two parents differ in size. Col-0 gives one band, Kar-1 gives a different-sized band, F1 gives both bands (heterozygous). One primer pair, one PCR, one gel.

**Primer design resources:**
- T-DNA lines: http://signal.salk.edu/tdnaprimers.2.html (input SALK stock number)
- Custom primers: use Primer3 or NCBI Primer-BLAST
- Lab primer inventory: [Primers_for_genotyping](https://docs.google.com/spreadsheets/d/1Y5vQwY257NeIk1zzeG6tguvpQG51n5AgEA1yNIQT8I0)

---

## Materials

- **Emerald Amp Max PCR mix** (TaKaRa) — 2x master mix containing Taq, dNTPs, buffer, and loading dye
  - Working stock: bottom shelf of fridge ([[Satoyo Oya]]'s space), stable ~3 months
  - Frozen stocks: freezer, white box labeled "Emerald Amp Max"
  - Thaw on ice, mix by inversion (never vortex)
- **Primer mix** (20 uM total): see preparation below
- **PCR-grade water** (Ultra Pure — not tap or DI)
- **DNA template:** 1 uL from [[wet-lab/quick-dna-extraction|Buffer A extraction]]
- 8-strip PCR tubes or 96-well plate
- Ice bucket
- Thermocycler

## Primer mix preparation

From three 100 uM primer stocks (LP, RP, BP for T-DNA; or just two primers for indel genotyping):

| Component | Amount |
|-----------|--------|
| Primer 1 (100 uM) | 10 uL |
| Primer 2 (100 uM) | 10 uL |
| Primer 3 (100 uM) | 10 uL (if using 3-primer strategy) |
| PCR-grade water | 120 uL (or 130 uL for 2 primers) |

Final concentration: ~6.7 uM each primer (20 uM total).

## Master mix (per reaction, 10 uL total)

| Reagent | 1 rxn | 8 rxn | 16 rxn |
|---------|-------|-------|--------|
| Emerald Amp Max mix | 5 uL | 40 uL | 80 uL |
| Primer mix (20 uM) | 0.2 uL | 1.6 uL | 3.2 uL |
| PCR-grade water | 3.8 uL | 30.4 uL | 60.8 uL |

**Always make extra** — calculate for N+1 reactions to account for pipetting loss.

## Procedure

1. **Keep everything on ice.** Thaw Emerald Amp on ice, flick to mix.
2. Prepare master mix in a clean 1.5 mL tube (scale from table above)
3. Aliquot **9 uL master mix** into each PCR tube/well
4. Add **1 uL DNA template** to each tube. Include controls:
   - **Positive control:** known wild-type DNA (for LP+RP band)
   - **Negative control:** water instead of DNA (no band = no contamination)
5. Seal tubes, briefly spin down if needed
6. Place in thermocycler, run **Emerald Genotyping** program:

| Step | Temp | Time | |
|------|------|------|-|
| Initial denature | 98 C | 1 min | |
| Denature | 98 C | 10 s | |
| Anneal | 58 C | 20 s | × 38 cycles |
| Elongate | 72 C | 40 s | |
| Final extension | 72 C | 2 min | |
| Hold | 4 C | ∞ | |

Program location: Invitrogen PCR machine / soya / Emerald genotyping

7. After PCR, proceed directly to [[wet-lab/gel-electrophoresis]]

> *Too many non-specific bands:* Reduce elongation time (try 30 s) or increase annealing temp (try 60 C).

> *No amplification at all:* Increase elongation time (try 60 s), reduce annealing temp (try 55 C), or check that DNA template isn't too concentrated (inhibition).

> *Different results on different thermocyclers:* Normal — block temperature calibration varies between machines. If a program works on one machine, note which one.

---

## T-DNA genotyping interpretation

| LP+RP band | BP+RP band | Genotype |
|------------|------------|----------|
| Yes | No | Wild-type |
| Yes | Yes | Heterozygous |
| No | Yes | Homozygous mutant |
| No | No | PCR failed — redo |

**Border primers by T-DNA collection:**
- SALK lines: LBb1.3
- SAIL lines: LB3
- GABI lines: check GABI-Kat database

---

## See also
- [[wet-lab/quick-dna-extraction]]
- [[wet-lab/gel-electrophoresis]]
- [Primers_for_genotyping spreadsheet](https://docs.google.com/spreadsheets/d/1Y5vQwY257NeIk1zzeG6tguvpQG51n5AgEA1yNIQT8I0)
- [T-DNA primer design tool](http://signal.salk.edu/tdnaprimers.2.html)
- [Ordering/establishing T-DNA lines](https://docs.google.com/document/d/1kJAXfBDfsHfSId-Rf-AxohcZjKdL3aStNkeIJpJ0WPU)
- [[lab-safety/Chemical Inventory]]
