# Quick DNA Extraction for PCR (Buffer A Method)

**Purpose:** Crude/fast DNA extraction from Arabidopsis leaf tissue for PCR genotyping. Not for sequencing or other applications requiring pure DNA — just enough template for a PCR reaction.

**Source:** [[Satoyo Oya]]'s Genotyping protocol ([Google Doc](https://docs.google.com/document/d/1Ntjr3jwrAEfu_PsRdqjOj0F_NCVHU1GqtIcL2dezXzI))

## Time estimate

**Wall time:** ~15 min | **Hands-on:** ~10 min (for 8-16 samples)

```
|████████| Cut leaf tissue, place in Buffer A    5 min (1-2 min per 8 samples)
|████| Load into thermocycler                    1 min
|░░░░░░░░| Boil 95 C                             5 min (walk away)
|████| Add TE, mix                               2 min
```

---

## Background

This is the simplest possible DNA extraction — you're lysing cells by boiling them in an alkaline, high-salt buffer. The heat denatures proteins, the high pH (Tris 9.5) helps solubilize DNA, the KCl provides ionic strength to keep DNA in solution, and EDTA chelates divalent cations to inhibit nucleases. The result is a crude lysate full of cellular debris, but it contains enough free DNA for PCR to work.

You don't purify the DNA at all — you just dilute the lysate in TE and use 1 uL directly as PCR template. This works because PCR is incredibly sensitive and Taq polymerase is reasonably tolerant of contaminants at low concentrations. The dilution step (20 uL → 120 uL) reduces inhibitor concentration below the threshold that would block PCR.

**Why not use a kit?** Kits (DNeasy, etc.) give pure DNA but take 30-60 min per sample and cost $2-5/sample. For genotyping where you just need a yes/no PCR result, Buffer A is free and takes 10 minutes.

---

## Materials

- **Buffer A:** 100 mM Tris-HCl pH 9.5, 1 M KCl, 10 mM EDTA
  - Location: [[Satoyo Oya]]'s shelf in lab
  - Check [[lab-safety/Chemical Inventory]] for components if making fresh
- **TE buffer:** dilute 50x stock (on chemical shelf) to 1x with DI water
- 8-strip PCR tubes or 96-well plate
- Fine scissors and forceps
- 70% ethanol + paper towels (for cleaning tools between samples)
- Thermocycler

## Procedure

1. Add **20 uL Buffer A** to each well of an 8-strip or 96-well plate
2. Cut a small piece of leaf tissue (~2 mm², about half a cotyledon) and submerge in Buffer A
3. **Press/squeeze** the tissue with forceps — do NOT crush or grind, just ensure it's submerged and slightly disrupted
4. **Wipe scissors and forceps** with EtOH-soaked paper towel between every sample (prevents cross-contamination)
5. Place in thermocycler, **boil at 95 C for 5 min**
6. Remove, add **100 uL TE buffer** to each well
7. Mix by pipetting. DNA is ready to use as PCR template (use 1 uL per reaction)

> *No PCR amplification:* Leaf chunk was too big — plant compounds (polyphenols, polysaccharides) inhibit Taq. Use a smaller piece next time, or dilute the template further (1:10).

> *Inconsistent results between samples:* Tissue amount varies. Try to be consistent with piece size. Also ensure the boiling step actually reached 95 C (check thermocycler lid heating is on).

---

## See also
- [[wet-lab/pcr-genotyping]]
- [[wet-lab/gel-electrophoresis]]
