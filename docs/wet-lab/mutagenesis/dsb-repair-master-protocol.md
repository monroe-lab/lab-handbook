---
type: protocol
title: "DSB DNA Repair - Master Protocol"
---

# DSB DNA Repair - Master Protocol


## Resources

**Reagents:** [[acrylamide]], [[agarose]], [[bis-n-n-methylene-bis-acrylamide]], [[carbenicillin-disodium-salt]], [[chloramphenicol]], [[gentamicin-sulfate-salt]], [[isopropyl-alcohol]], [[kanamycin-sulfate]], [[mes-buffer]], [[nuclease-free-water]], [[peptones-casein-tryptone]], [[sodium-dodecyl-sulfate]], [[tetracycline-hydrochloride]], [[yeast-extract]], [[zeocin]]

**Related Protocols:** [[gel-electrophoresis]], [[pcr-genotyping]], [[protein-induction-bl21]]

**Contacts:** [[grey-monroe]]

Designing Protospacers

Restriction Digestion of pEnChimera

Obtain pEnChimera Plasmid

1. Grow overnight culture of pEnChimera in 3mL liquid LB with 3μM carb. antibiotic
2. Mini-prep plasmid and measure concentration with Qubit

Restriction Digestion

1. Combine 1μg plasmid, 5μL 10X Buffer, 1μL Restriction Digestion Enzyme, and nuclease-free water to 50μL total volume
2. Incubate at 37C for 15min
3. Deactivate enzyme at 65C for 20min

Anneal Oligos

1. Combine 46μL nuclease-free water with 2μL forward and 2μL reverse oligo
2. Incubate at 95C for 5min
3. Cool at RT for 20min

Ligation of pEnChimera and Oligos

1. On ice combine…

1. 13.5μL nuclease-free water
2. 2.5μL digested pEnChimera
3. 1μL oligo
4. 2μL Ligase Buffer
5. 1μL Ligase

2. Mix by pipetting, then microfuge
3. Incubate at RT for 10min
4. Deactivate enzyme at 65C for 10min
5. Chill on ice

[[gel-electrophoresis]] (Confirmation that Digestion and Ligation were successful)

1% Agar Gel

1. Combine 1g [[agarose]] for every 100mL 1X TAE Buffer
2. Mix with stir bar
3. Microwave until solution is completely clear, pausing intermittently when it bubbles
4. Pour into mold and let sit for at least 30min to cool and harden completely

1.5% Agar Gel

1. Combine 1.5g agarose for every 100mL 1X TAE Buffer
2. Mix with stir bar
3. Microwave until solution is completely clear, pausing intermittently when it bubbles
4. Pour into mold and let sit for at least 20min to cool and harden completely

Run Gel

1. Pipette solutions into wells

1. pEnChimera, Digested pEnChimera, Ligated pEnChimera

2. Run at 100V for 30-40min

Stain Gel

1. Place gel in SYBR Gold stain and rock for 15min
2. Image (Ligated pEnChimera should be longer than Digested pEnChimera)

Transform Stellar E. coli with pEnChimera + gRNA (carb plate)

1. Thaw Stellar Competent Cells on ice for 15min
2. Vortex and microfuge ligated pEnChimera
3. On ice, transfer 50µL Stellar CC into labeled tubes (will be thrown out) with cut pipette tips
4. Add 2µL of ligated pEnChimera
5. Mix by tapping and keep on ice for 10min
6. Add 800µL liquid LB (no antibiotic), place in shaking incubator at 37C and 150RPM for 30min
7. Place carb. plates in incubator for 10min
8. Spin down tubes to collect cells for 1min at 8000RPM
9. Remove 500µL of supernatant
10. Resuspend cells by pipetting
11. Plate cells, parafilm, then place in incubator overnight

Colony PCR to confirm pEnChimera + gRNAs

Selecting Colonies

1. Fill PCR strips with 50µL of PCR-grade water
2. Label carb. plate with lines to make a replica plate
3. Select 8 single colonies from each plate

1. Touch a single colony with a pipette tip
2. Touch the tip to the replica plate
3. Place the tip in a tube with water in the PCR strip and swirl

4. Parafilm and place replica plate in incubator

Assemble PCR

1. Combine the following to make a Primer Mix for each gRNA, vortex and microfuge

1. 80µL PCR-grade water
2. 10µL SS42 (100µM)
3. 10µL Forward Oligo (100µM)

2. On ice, combine the following to make a Premix for each gRNA, pipette to mix

1. 34.2µL PCR-grade water
2. 1.8µL Primer Mix
3. 45µL Emerald Amp Master Mix

3. Label PCR strips, add 9µL of Premix and 1µL of DNA (from “Selecting Colonies” tubes)

Run PCR

1. Start program in Invitrogen PCR machine/Kaia/Emerald GENOTYPING
2. Allow machine to heat
3. Place PCR tubes in machine and close
4. Skip first step

Gel Electrophoresis for confirmation of PCR

1. Microwave 1.5% Agar Gel until clear with no solids
2. Let cool for 5 min
3. Pour into gel mold
4. Let set for at least 20min to solidify
5. Load with 2µL of the following

1. 1kb+ ladder
2. PCR results

6. Run at 100V for 30-40min
7. Rock in SYBR Gold stain for 15min
8. Image

Whole Plasmid Sequencing

1. Mini-prep plasmids (pEnChimera + gRNAs) and use Qubit to find concentrations
2. Label 8-strip tubes with sample names
3. Add 12µL of DNA with concentrations 50-100ng/µL, diluting in nuclease-free water if necessary
4. Enter online order info here
5. Place in QuintaraBio drop box at Green Hall
6. Confirm sequences when results are sent

Gateway Cloning (2 day protocol)

Preparation

1. Culture pEnChimera + gRNA and pDERC9 overnight in shaking incubator at 37C and 150RPM
2. Miniprep pEnChimera + gRNA, find concentration via Qubit
3. Miniprep pDERC9, find concentration via Qubit

Day 1

1. Combine the following in a 1.5mL tube

1. 1X TE Buffer to 10µL (~5-6µL)
2. 25ng of pEnChimera + gRNA
3. 100ng pDERC9

2. Vortex briefly and microfuge
3. On ice, thaw LR Clonase II for 2min
4. Add 2µL LR Clonase II
5. Vortex briefly and microfuge
6. Incubate at RT overnight

Day 2

1. Add 1µL Proteinase K
2. Vortex briefly and microfuge
3. Incubate at 37C for 10min

Transform Stellar E. coli (carb + kan plate)

1. Thaw Stellar Competent Cells on ice for 15min
2. Vortex and microfuge Gateway Reactions
3. On ice, transfer 50µL Stellar CC into labeled tubes (will be thrown out) with cut pipette tips
4. Add 2µL of Gateway Product
5. Mix by tapping and keep on ice for 10min
6. Add 800µL liquid LB (no antibiotic), place in shaking incubator at 37C and 150RPM for 30min
7. Place carb. +kan plates in incubator for 10min
8. Spin down tubes to collect cells for 1min at 8000RPM
9. Remove 500µL of supernatant
10. Resuspend cells by pipetting
11. Plate cells, parafilm, then place in incubator overnight

Colony PCR

Selecting Colonies

1. Fill PCR strips with 50µL of PCR-grade water
2. Label carb. + kan plate with lines to make a replica plate
3. Select 8 single colonies from each plate

1. Touch a single colony with a pipette tip
2. Touch the tip to the replica plate
3. Place the tip in a tube with water in the PCR strip and swirl

4. Parafilm and place replica plate in incubator

Assemble PCR

1. Combine the following to make a Primer Mix for each gRNA, vortex and microfuge

1. 80µL PCR-grade water
2. 10µL KA130 (100µM)
3. 10µL Forward Oligo (100µM)

2. On ice, combine the following to make a Premix for each gRNA, pipette to mix

1. 34.2µL PCR-grade water
2. 1.8µL Primer Mix
3. 45µL Emerald Amp Master Mix

3. Label PCR strips, add 9µL of Premix and 1µL of DNA (from “Selecting Colonies” tubes)

Run PCR

1. Start program in Invitrogen PCR machine/Kaia/GW EMERALD Genotyping
2. Allow machine to heat
3. Place PCR tubes in machine and close
4. Skip first step

Gel Electrophoresis

1. Microwave 1.5% Agar Gel until clear with no solids
2. Let cool for 5 min
3. Pour into gel mold
4. Let set for at least 20min to solidify
5. Load with 2µL of the following

1. 1kb+ ladder
2. PCR results

6. Run at 100V for 30-40min
7. Rock in SYBR Gold stain for 15min
8. Image

Whole Plasmid Sequencing

1. Mini-prep plasmids (pDERC9 + gRNAs) and use Qubit to find concentrations
2. Label 8-strip tubes with sample names
3. Add 12µL of DNA with concentrations 50-100ng/µL, diluting in nuclease-free water if necessary
4. Enter online order info here
5. Place in QuintaraBio drop box at Green Hall
6. Confirm sequences when results are sent
