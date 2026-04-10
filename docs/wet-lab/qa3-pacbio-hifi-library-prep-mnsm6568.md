---
title: "QA3 PacBio HiFi Library Prep mnsm6568"
type: "protocol"
---
# QA3 PacBio HiFi Library Prep mnsm6568

*Created by greymonroe on 2026-04-10*

## Overview

This protocol covers PacBio HiFi library preparation for whole genome sequencing. Adapted from the SMRTbell prep kit 3.0 protocol. Expected insert size: 15-20 kb. Input DNA requirement: 5 ug high molecular weight gDNA.

## Materials

* SMRTbell prep kit 3.0
* AMPure PB beads
* Elution buffer
* 80% ethanol (freshly prepared)
* Qubit dsDNA HS assay kit
* Agilent Femto Pulse system
* Thermal cycler
* Magnetic rack
* Low-bind 1.5 mL tubes
* Wide-bore pipette tips

## Procedure

1. Assess DNA quality: Run 1 uL on Femto Pulse. Verify majority of fragments >40 kb.
2. Quantify input: Measure concentration with Qubit HS. Calculate volume for 5 ug total.
3. Shear DNA: Use Megaruptor 3 at speed setting 31 for 15-20 kb target size.
4. Post-shear QC: Run 1 uL sheared DNA on Femto Pulse. Confirm peak at 15-20 kb.
5. DNA damage repair: Add 1 uL DNA damage repair mix. Incubate 37C for 30 min.
6. End repair: Add 1 uL end repair mix. Incubate 20C for 10 min.
7. A-tailing: Add 1 uL A-tailing mix. Incubate 30C for 60 min.
8. Adapter ligation: Add 1 uL overhang adapter v3. Add 1 uL ligation mix. Incubate 20C for 60 min, then 65C for 10 min to inactivate.
9. Nuclease treatment: Add 1 uL nuclease mix. Incubate 37C for 60 min. This removes failed ligation products.
10. Size selection (0.45x AMPure): Add 0.45x volume AMPure PB beads. Mix gently by inversion 10x. Incubate 5 min RT. Place on magnet 5 min. Transfer supernatant to new tube.
11. Size selection (0.80x AMPure): Add additional beads to bring total to 0.80x. Mix by inversion. Incubate 10 min RT. Magnet 10 min. Remove supernatant.
12. Wash beads: Add 200 uL 80% ethanol. Wait 30 sec. Remove. Repeat wash.
13. Elute: Air dry beads 30 sec (do not over-dry). Add 30 uL elution buffer. Incubate 5 min RT. Place on magnet. Transfer eluate.
14. Final QC: Measure concentration by Qubit HS. Run 1 uL on Femto Pulse.
15. Calculate molarity: Use formula: (concentration in ng/uL) / (660 \* average fragment length in bp) \* 1e6 = nM.
16. Submit library: Prepare 500 pM loading concentration. Submit to sequencing core with completed sample submission form.

## Notes

* Critical: Do not vortex HMW DNA at any step. Use wide-bore tips only.
* AMPure bead ratios may need optimization for different input DNA sources.
* Expected yield: 500 ng to 2 ug from 5 ug input.