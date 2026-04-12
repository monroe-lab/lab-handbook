---
type: project
title: "Molecular Biology Training Curriculum"
status: "active"
pi: "Grey Monroe"
---

# Molecular Biology Training Curriculum

A 10-week hands-on training program for new Monroe Lab members. Students progress from fundamental bench skills through DNA extraction, PCR, and nanopore sequencing, culminating in a de novo genome assembly of an Arabidopsis T-DNA insertion mutant line.

## Program Structure

**Duration:** 10 weeks (one UC Davis quarter)
**Commitment:** 10 hours/week in the lab
**Capstone deliverable:** A nanopore genome assembly of a SALK T-DNA line assigned by Grey

Students work through protocols in order. Each protocol produces a concrete output that demonstrates competence. Plant growth runs in parallel with bench skill development: seeds go in the ground early so tissue and seed are ready when students need them.

## The Tech Tree

Protocols are organized into tiers. Within a tier, protocols can be done in any order unless a specific dependency is noted. The capstone (Tier 11) reuses protocols from every prior tier.

### Tier 1 — Foundations (Week 1)

Day 1 skills. No prerequisites except showing up.

| Protocol | Time | Description |
|----------|------|-------------|
| [[lab-orientation]] | 1.5 hr | Map of lab spaces, where everything is stored, fridge/freezer locations, waste streams, shared equipment |
| [[pipette-school]] | 2.5 hr | All pipette sizes, all tip types. Exercises with water and dyes: pipette the same volume 10x, photograph for consistency |
| [[how-to-use-the-scale]] | 1 hr | Analytical balance and top-loader. Taring, weighing solids, weighing liquids, cleanup |
| [[tube-and-sample-labeling]] | 0.5 hr | Labeling conventions, what survives ethanol/-80C/autoclave, when to use printed vs. hand-written labels |
| [[bench-cleanup]] | 0.5 hr | Post-experiment cleanup checklist. What gets wiped, with what, when |

**Tier total: ~6 hours**

### Tier 2 — Basic Lab Operations (Weeks 1-2)

Operating the core equipment. Culminates in making MS media plates, which integrates scale, pH, autoclave, and clean bench skills.

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[autoclave]] | 0.5 / 1.5 hr | Lab Orientation | Loading, cycle selection, safety, unloading. Shared autoclave in Robbins Hall |
| [[clean-bench]] | 0.5 / 1 hr | Lab Orientation | Startup, UV, airflow, sterile technique, shutdown |
| [[centrifuge-operation]] | 0.5 hr | Lab Orientation | Benchtop microcentrifuge and large refrigerated centrifuge. Balancing, speeds, rotors |
| [[water-bath-and-heat-block]] | 0.5 hr | Lab Orientation | Setting temperature, equilibration, when to use which, cleanup |
| [[vortexer-and-mixer-use]] | 0.25 hr | — | Speed settings, vortex vs. flick vs. invert |
| [[ph-measurement]] | 1 hr | Scale, Lab Orientation | Calibration, measuring, adjusting with acid/base, electrode storage |
| [[ms-media-recipe]] | 1 / 3 hr | Scale, pH, Autoclave, Clean Bench | Make one batch of MS media plates. First real integrative protocol |

**Tier total: ~8 hours hands-on**

### Tier 3 — Reagent Preparation (Week 3)

Students make their own buffer stocks that they will use throughout the program.

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[make-tae-buffer]] | 0.5 / 1 hr | Scale, pH | 50x stock for gel electrophoresis |
| [[make-te-buffer]] | 0.5 hr | Scale | Used everywhere: dilutions, elutions, storage |
| [[make-agar-seed-suspension]] | 0.25 / 1 hr | Scale, Autoclave | 0.1% agar for planting seeds on plates |
| [[spri-beads-preparation]] | 1 / 2.5 hr | Scale, TE Buffer | Homemade magnetic beads for DNA cleanup |

Additional buffer protocols (Buffer A, lysis buffers, CTAB buffers) are written as standalone protocols and linked from the extraction protocols that use them in Tier 7.

**Tier total: ~5 hours**

### Tier 4 — Plant Growth (Weeks 3-4, then ongoing care)

Two parallel tracks converge. Plants started in Week 3 provide tissue for extraction in Weeks 6-7 and seed by Week 10+.

**Track A: Plates**

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[seed-sterilization]] | 0.25 / 0.5 hr | Clean Bench | Ethanol method for routine use |
| [[stratification]] | 0.1 / 48 hr wait | Seed Sterilization | 2 days at 4C to break dormancy |
| [[planting-arabidopsis-on-ms-plates]] | 0.5 hr | MS Plates, Stratification, 0.1% Agar | Planting seeds onto plates using pipette and agar suspension |
| [[growth-chamber-operation]] | 0.5 hr | Lab Orientation | Temperature, lighting schedules, chamber locations (Asmussen Hall) |

**Track B: Soil**

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[planting-in-soil]] | 0.5 hr | Stratification | Direct sowing, pot prep, soil prep |
| [[transferring-seedlings-to-soil]] | 0.5 hr | Plate seedlings (~14 days old) | Transplanting from plates to pots |

**Converged**

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[watering-and-plant-care]] | 0.5 hr | Planting in Soil | Watering schedule, what to look for, common problems |
| [[bulking-seed]] | 1 hr + weeks of growth | Flowering plants (~5 wks) | Grow to maturity, harvest, clean, store, log seed stock |

**Tier total: ~4 hours hands-on, weeks of calendar time**

### Tier 5 — Tissue Handling (Week 5)

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[liquid-nitrogen-safety]] | 0.5 hr | Lab Orientation | PPE, dewar handling, pouring, frostbite first aid. References Cryogens SOP |
| [[harvesting-leaf-tissue]] | 1 / 1.5 hr | LN2 Safety, plants with true leaves (~3 wks) | Collection technique, flash-freezing, labeling, freezer box logging |

**Tier total: ~2 hours**

### Tier 6 — Safety Quick-Reference (Weeks 3-4, interleaved)

Short action guides. Not full SOPs (those already exist) but the TL;DR for immediate situations.

| Protocol | Time | Description |
|----------|------|-------------|
| [[spill-response]] | 0.5 hr | Decision tree: identify chemical, consult SDS, spill kit, cleanup, notify |
| [[breakage-response]] | 0.5 hr | Broken glass cleanup, equipment failure reporting |
| [[sharps-handling]] | 0.25 hr | What counts as a sharp, container locations, disposal |
| [[how-to-read-an-sds]] | 0.5 hr | Finding an SDS, what sections matter, where copies are |
| [[waste-disposal-quick-reference]] | 0.5 hr | Chemical, biological, sharps, glass, regular trash. Which bin, where |

**Tier total: ~2.25 hours**

### Tier 7 — DNA Extraction (Weeks 5-7)

Progressive complexity: fast-and-dirty extraction first, then kit-based, then HMW for long-read sequencing.

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[quick-dna-extraction]] | 0.25 / 0.5 hr | Harvested tissue, Centrifuge | Buffer A boil prep. Fast, not sequencing-quality. First exposure to extraction |
| [[make-buffer-a]] | 0.5 hr | Scale, pH | Tris-HCl + KCl + EDTA. Standalone buffer protocol |
| [[quantifying-dna-qubit]] | 0.5 / 1 hr | DNA sample | DeNovix fluorometer. Standards, measurement, interpretation |
| [[quantifying-dna-nanodrop]] | 0.25 hr | DNA sample | 260/280, 260/230 ratios. NanoDrop needs ordering (placeholder) |
| [[qiagen-dneasy-extraction]] | 1 / 3 hr | Harvested tissue, Centrifuge, Heat Block | Kit-based column extraction. Higher quality than Buffer A |
| [[hifi-dna-extraction]] | 2 / 5 hr | LN2, Centrifuge, HiFi Lysis Buffer, Fume Hood | Satoyo's HMW method for Arabidopsis (Rabanal et al. 2022). Yields 1-4 ug. **This is the capstone extraction method.** |

Buffer sub-protocol:

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[make-hifi-lysis-buffer]] | 0.25 hr | Scale, Fume Hood | PVP40, sodium metabisulfite, NaCl, Tris, EDTA, BME, SDS. Made fresh on extraction day. |

**Tier total: ~12 hours**

**For the capstone, students use the [[hifi-dna-extraction|HiFi DNA Extraction]] method** on their Arabidopsis SALK line. The lab also has the [[sorbitol-ctab-hifi-extraction|Sorbitol/CTAB method]] (Vianney's protocol, Inglis et al. 2018) for challenging plant species, but it is not part of the 10-week curriculum.

### Tier 8 — PCR and Gel Electrophoresis (Weeks 7-8)

Students first practice on Col-0 with known primers, then design primers for their SALK line and confirm the genotype.

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[making-an-agarose-gel]] | 0.5 / 1 hr | TAE Buffer, Scale | Weighing agarose, melting, pouring, combs |
| [[gel-electrophoresis]] | 0.25 / 0.75 hr | Agarose Gel, PCR product | Loading, running, staining with SYBR Gold |
| [[gel-imaging-and-annotation]] | 0.25 hr | Stained gel | UV transilluminator, phone camera, annotating lanes and bands |
| [[pcr-genotyping]] | 0.5 / 2 hr | Quick Extraction DNA | Emerald Amp master mix, thermocycler, 3-primer strategy for T-DNA |
| [[primer-design]] | 2 / 3 hr | PCR understanding | Using SALK T-DNA primer tool, Primer3. Students design primers for their assigned line |
| [[sanger-sequencing]] | 0.25 hr | PCR product | EXO-CIP cleanup, Eurofins submission |

**Tier total: ~7 hours**

### Tier 9 — Nanopore Sequencing (Weeks 9-10)

Hands-on sequencing on the lab's MinION.

| Protocol | Time | Prereqs | Description |
|----------|------|---------|-------------|
| [[nanopore-rapid-library-prep]] | 1 / 2 hr | HMW DNA, Qubit QC | Oxford Nanopore Rapid Sequencing Kit |
| [[loading-a-minion-flow-cell]] | 1 / 1.5 hr | Library prep | Flow cell QC, loading, starting a run, monitoring |
| [[nanopore-data-retrieval]] | 1 hr | Completed run | File formats (POD5), getting data off the instrument, onto the analysis pipeline |

**Tier total: ~5 hours**

### Tier 11 — Capstone: Genome Assembly of an Arabidopsis T-DNA Mutant

Not separate protocols. The capstone is the student executing protocols from every prior tier on their assigned SALK line:

1. **Receive assignment** — Grey assigns a SALK T-DNA insertion line
2. **Grow the line** (Tier 4) — Plant seeds, grow to maturity, begin seed bulking
3. **Genotype confirmation** (Tier 8) — Design primers for the insertion site, run PCR, confirm homozygosity on a gel
4. **HMW DNA extraction** (Tier 7) — Extract long-read-quality DNA using the [[hifi-dna-extraction|HiFi DNA Extraction]] method
5. **QC** (Tier 7) — Qubit quantification, assess quality
6. **Nanopore sequencing** (Tier 9) — Rapid library prep, load MinION, run
7. **Genome assembly** — Grey provides a bioinformatics module. Student runs their data through it. No coding required.
8. **Final product** — Assembled genome deposited in lab database. Seed stock logged and inventoried.

## 10-Week Schedule

Plant growth is the critical path. Arabidopsis needs ~3 weeks to produce harvestable tissue and ~10 weeks for mature seed. The schedule front-loads planting so tissue is ready when students reach DNA extraction.

| Week | Lab hours | What happens |
|------|-----------|-------------|
| **1** | 10 | Tier 1 (foundations). Start Tier 2 (autoclave, clean bench, centrifuge, heat block, vortexer) |
| **2** | 10 | Finish Tier 2 (pH, make MS plates). Sterilize + stratify Col-0 practice seeds |
| **3** | 10 | Tier 3 (make TAE, TE, 0.1% agar, SPRI beads). Plant Col-0 on plates and in soil. Tier 6 (safety quick-refs). Sterilize + stratify assigned SALK line seeds |
| **4** | 10 | Plant SALK line in soil. Growth chamber setup. Tier 4 (plant care, watering). Transferring seedlings. Start reading Tier 7 protocols |
| **5** | 10 | Tier 5 (LN2 safety, harvest Col-0 leaf tissue). Tier 7 begins (quick extraction + Buffer A on Col-0, Qubit). Make extraction buffers |
| **6** | 10 | Tier 7 continues (DNeasy kit extraction, practice HiFi DNA Extraction on Col-0). Tier 8 begins (make agarose gel, practice PCR with known Col-0 primers, run gel, image) |
| **7** | 10 | Harvest SALK line tissue. Primer design for SALK insertion site. Genotype confirmation PCR + gel. HiFi DNA Extraction on SALK line |
| **8** | 10 | QC SALK HMW DNA (Qubit). Troubleshoot and re-extract if needed. Begin Tier 9 (nanopore rapid library prep) |
| **9** | 10 | Load MinION flow cell, start sequencing run. Data retrieval. Begin seed harvest if plants are mature |
| **10** | 10 | Bioinformatics module (Grey provides). Assembly. Final documentation. Seed stock logged. Capstone complete |

**Key scheduling notes:**

- Col-0 (wild-type) is the practice organism for Weeks 3-6. Students learn every technique on Col-0 before touching their assigned mutant line.
- SALK line seeds go in Week 3-4. By Week 7, plants have true leaves ready for tissue harvest and genotyping.
- Seed bulking may extend beyond Week 10. That's fine. The genome assembly is the capstone deliverable, not the seed stock. Students can harvest seed on their own schedule after the program.
- Week 8 has deliberate slack for troubleshooting. HMW extraction doesn't always work on the first try.

## Team

- [[grey-monroe]] (PI, program director)

## Completion Tracking

Students check off each protocol as they complete it. "Complete" means: the protocol was executed, a concrete output was produced (plate, gel image, Qubit reading, etc.), and results were documented in the digital lab notebook with the protocol cited.

| Tier | Protocols | Check |
|------|-----------|-------|
| 1. Foundations | Lab Orientation, Pipette School, Scale, Labeling, Bench Cleanup | |
| 2. Basic Ops | Autoclave, Clean Bench, Centrifuge, Water Bath, Vortexer, pH, MS Plates | |
| 3. Reagents | TAE, TE, 0.1% Agar, SPRI Beads | |
| 4. Plant Growth | Seed Sterilization, Stratification, Planting on Plates, Growth Chamber, Planting in Soil, Transferring, Watering, Bulking Seed | |
| 5. Tissue Handling | LN2 Safety, Harvesting Leaf Tissue | |
| 6. Safety | Spill Response, Breakage, Sharps, Read an SDS, Waste Disposal | |
| 7. DNA Extraction | Quick Extraction, Buffer A, Qubit, NanoDrop, DNeasy, HiFi Lysis Buffer, HiFi DNA Extraction | |
| 8. PCR / Gel | Agarose Gel, Gel Electrophoresis, Gel Imaging, PCR, Primer Design, Sanger Sequencing | |
| 9. Nanopore | Rapid Library Prep, Loading MinION, Data Retrieval | |
| 11. Capstone | Genotype confirmed, HMW DNA extracted, Sequencing complete, Assembly deposited | |

## Related

- [[pistachio-pangenome]]
- [[mutation-accumulation]]
