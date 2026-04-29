---
type: "protocol"
title: "HiFi DNA Extraction (DIY)"
---
# HiFi DNA Extraction (DIY)

**Time estimate:** ~3.5-4 hr hands-on (20 min grind + lysis prep, 30 min lysis + RNase at 55°C, 25 min PCI/CI extractions including spins, 30-60 min SPRI bead binding, 2x EtOH washes, 15 min EB elution, optional 15 min Collibri bead step), plus a required **overnight rest on the bench** for HMW DNA to homogenize before QC. Active bench time is mostly waiting on incubations and magnetic separations — plan a half-day with another task to fill gaps.

## Resources

**Equipment:** [[automill]], [[centrifuge]], [[clean-bench-laminar-flow]], [[femtopulse]], [[hula-mixer]], [[magnetic-rack]], [[nanodrop]], [[thermomixer]]

**Kits:** [[colibri-dna-library-cleanup-kit]]

**Reagents:** [[1-8-naphthalic-anhydride]], [[1m-tris-hcl-ph-8-8-5]], [[chloroform]], [[chloroform-isoamyl-alcohol-24-1]], [[dnase]], [[ethanol-70]], [[isopropyl-alcohol]], [[mes-buffer]], [[phenol-chloroform-isoamyl-alcohol-25-24-1]], [[polyethylene-glycol-solid]], [[potassium-acetate]], [[sodium-acetate-anhydrous]], [[sodium-dodecyl-sulfate]], [[tris-base]]

**Related Protocols:** [[sorbitol-ctab-hifi-extraction]], [[kalanchoe-ctab-extraction]], [[hmw-extraction-challenging-plants]], [[in-house-hifi-shearing-pipeline]]

**Contacts:** [[grey-monroe]], [[kehan-zhao]], [[satoyo-oya]]

**Prerequisites:** [[harvesting-leaf-tissue]], [[centrifuge-operation]], [[make-hifi-lysis-buffer]], [[quantifying-dna-qubit]]

**Purpose:** Extract high-molecular-weight (HMW) genomic DNA from Arabidopsis leaf tissue for long-read sequencing (Nanopore, PacBio). This is the primary HMW extraction method for the training curriculum capstone. Yields 1-4 ug of HMW DNA from ~100 mg Arabidopsis tissue.

Satoyo Oya, 2025

<br>
<br>
[[1-8-naphthalic-anhydride]]

## HiFi Extraction Protocol

Based on [(Rabanal et al. 2022)](https://paperpile.com/c/Ov8wZy/6421), which adopted and triplicated the protocol[(Russo et al. 2022)](https://paperpile.com/c/Ov8wZy/JoWJ) modified from [(Mayjonade et al. 2016)](https://paperpile.com/c/Ov8wZy/veB8)’s modified protocol

Works for Arabidopsis (yields 1-4 µg in our lab). Also validated for species from Orchidaceae, Poaceae, Brassicaceae, Asteraceae in Russo 2022. As of 2025 it didn’t work for kalanchoe or pistachio.

#### Materials

* Plant tissue \~100 mg each, in 2 ml impact-resistant tube (USA Scientific #1420-9600) with metal beads, LN2 frozen
* Freshly made [[hifi-lysis-buffer|HiFi Lysis Buffer]] (see [[make-hifi-lysis-buffer]] — must be prepared fresh on the day of extraction)

| Reagent | Stock concentration | Final amount | Final concentration |
| ------- | ------------------- | ------------ | ------------------- |
| PVP40 |  | 0.1 g | 1% |
| Sodium metabisulphite |  | 0.1 g | 1% |
| NaCl | 5 M | 1 ml | 0.5 M |
| Tris HCl pH 8 | 1 M | 1 ml | 100 mM |
| EDTA pH 8 | 0.5 M | 1 ml | 50 mM |
| β-mercaptoethanol |  | 200 µl | 2% |
| SDS (add at the last) | 10% | 1.5 ml | 1.5% |
| H2O (mol. biol. grade) |  | Up to 10 ml |  |

* PureLinkTM RNAseA (Thermo Fisher Scientific; #12091021), or 100 mg/ml DNase-free RNase A /(Qiagen, Germantown, MD, United  States)
* 5 M [[potassium-acetate]] (KAc)
* 25:24:1 (v/ v/ v) phenol:[[chloroform]]:isoamyl alcohol (ROTI; #A156.1)
* 24:1 (v/v) chloroform:isoamyl alcohol
* 0.4% solution of SeraMag SpeedBeads® Carboxyl Magnetic Beads (#65152105050250, Fisher  Scientific) prepared  as  in Schalamun et al. (2019)

1. First combine only Water, Tris-HCl, EDTA and NaCl in a 50 mL tube.
2. Vortex Sera-Mag SpeedBeads (GE Healthcare, 65152105050250) very well and pipette 40 μl into a 1.5 ml tube, put it on the [[magnetic-rack]] and wait until solution has cleared up and all beads have bound to the back of the tube
3. Wash beads by removing supernatant and adding 1.5 ml milliQ water
4. Take tube of the magnet, mix well, spin down in a microcentrifuge and put back on the magnet
5. Wait for beads to assemble at the back of the tube
6. Pipette off and discard supernatant
7. Repeat washing (steps 3 - 6) 3 more times
8. After pipetting of the supernatant the last time take off tube from the magnet and add 40 μl of the previous (step 1) prepared stock solution, mix well, spin down and pipette everything into the remaining stock solution in the 50 mL tube and mix
9. Now the 2.2 ml 50% PEG can be added to the stock solution, which after vortexing very well is ready for use. Be careful to accurately pipette 2.2 ml as the solution is very viscous, but the final concentration of PEG is crucial for the clean up to work properly.

| Reagent | Stock concentration | Final amount | Final concentration |
| ------- | ------------------- | ------------ | ------------------- |
| Tris–HCl pH 9.0 | 1 M | 100 µl | 10 mM |
| EDTA pH 8.0 | 0.5 M | 20 µl | 1 mM |
| NaCl | 5 M | 3.2 ml | 1.6 M |
| PEG 8000 | 50 % (w/v) | 2.2 ml | 11 % |
| SeraMag beads | 100 % | 40 µl | 0.4 % |
| H2O (mol. biol. grade) |  | Up to 10 ml (=4.44 ml) |  |

* Qiagen EB Buffer or 10 mM Tris-HCl pH 8.5
* 80% ethanol (freshly prepared)
* wide-bore pipet tip
* Collibri DNA beads kit

#### Prepare

* Pre-heat the Lysis buffer to 55 ℃ (dissolve PVP!)
* Pre-warm the [[thermomixer]] to 55 ℃
* Make sure the [[centrifuge]] is not chilled
* Preheat EB buffer to 50℃
* Move PCI (Phenol/Chloroform/Isoamyl alcohol) to room temperature (RT)
* Identify the waste container in the chemical hood- waste solutions from the procedures 1 to 10 should be discarded in the appropriate container in the chemical hood.

#### Procedure


| ◻︎ | 1. | Grind the plant tissue in [[automill]] to obtain fine powder. | 213 rpm x 60 sec for arabidopsis leaf |
| --- | --- | --------------------------------------------------------- | ------------------------------------- |
| ◻︎ | 2. | Remove beads, Add 600 µl of pre-warmed lysis buffer to the still frozen sample, vortex for 3-5 s, and incubate for 20 min at 400 rpm, 55 ℃ | Lysis. Deactivate DNases and remove polyphenols. |
| ◻︎ | 3. | Add 20 µl of RNase (= 400 µg), and incubate for 10 min more at 55 ℃ |  |
| ◻︎ | 4. | Add 200 µl of 5 M KAc, and mix by inverting the tube 25 times |  |
| ◻︎ | 5. | [in the chemical hood] add 800 µl of PCI, and incubate for 10 min at 20 rpm | Use HulaMixer |
| ◻︎ | 6. | Centrifuge for 10 min at 7 kg, RT |  |
| ◻︎ | 7. | Transfer the supernatant to a new 2 ml tube with wide-bore pipet tip |  |
| ◻︎ | 8. | Add 800 µl of CI, incubate for 10 min at 20 rpm |  |
| ◻︎ | 9. | Centrifuge for 10 min at  7 kg, RT | It’s okay if the sample is separated before centrifuge |
| ◻︎ | 10. | Transfer the supernatant to a new 2 ml tube and record the volume (600-800 µl) |  |
| ◻︎ | 11. | Add the equal volume of 0.4 % SeraMag beads, and incubate for 30\~60 min at 10 rpm at RT. | 30 min is fine |
| ◻︎ | 12. | Place the tube on the magnetic rack, and wait until the solution becomes clear. Remove supernatant. | This step can take several minutes, as the viscosity of the solution may slow down the beads’  migration. |
| ◻︎ | 13. | Add 1 ml of 80% EtOH, and immediately resuspend the beads pellet by inverting 25 times. Place the tube on the magnetic rack, wait until the solution become clear. Remove supernatant (1st wash). | Beads may aggregate. It helps to minimize the EtOH incubation time |
| ◻︎ | 14. | Repeat the step 13 (EtOH wash) again (2nd wash) |  |
| ◻︎ | 15. | Add 50 µl of pre-heated (50℃) EB buffer, and incubate for 15 min at 37℃ with rotation , and place the tube to the magnetic rack | Beads migration could take 30 min on some plants;  30 sec for Arabidopsis |
| ◻︎ | 16. | Transfer the supernatant to a new 1.5 ml tube using wide-bore pipet tip. |  |
| ◻︎ | 17. | Add 20 µl of Collibri beads, rotate at 10 rpm for 15 min at 37℃. Repeat Steps 12-16. | Arabidopsis needs this additional step. Other plants may not. |
| ◻︎ | 18. | Leave the tube on your bench for overnight | To allow DNA to homogenize and relax |
| ◻︎ | 19. | Measure the concentration on Qubit BR and [[nanodrop]]. |  |

QC guideline:

1. Concentration: For arabidopsis, I typically get 15\~80 ng/µl in Qubit BR
2. Compare Qubit & nanodrop: If nanodrop concentration is less than the double of Qubit concentration, the quality is good.
3. [[femtopulse]]. $27/sample at genome center. Resolves 1 kb-200 kb range. Submit 2 µl in 0.5-1.5 ng/µl in EB or TE buffer.
4. Nanodrop A260/A230, A260/A280 over 1.7 is good, but don’t worry if it’s below 1.7- the first step of the library prep includes beads purification.

***

### Infos that may be useful

How much tissues is worth 100 mg in Arabidopsis?

Other HMW DNA extraction kits;

NucleoBond HMW DNA (TakaRa)

Up to 1.5 g of plant tissue, the typical yield is 2-20 µg, approx $10/sample.

Genomic tip

[https://nanoporetech.com/document/extraction-method/arabidopsis-leaf-dna](https://nanoporetech.com/document/extraction-method/arabidopsis-leaf-dna)

$521/25 columns

Promega Wizard HMW

40 mg spinach = 1.7 µg… But it has been around since 7/22, and no citation in the product page?

Monarch HMW

Is it not tested for Plant?

PacBio HMW (Nanobind PanDNA kit) $324/24 prep

1 g sample = 5-20 µg yield, which is more than enough.

Didn’t work for pistachio

***
