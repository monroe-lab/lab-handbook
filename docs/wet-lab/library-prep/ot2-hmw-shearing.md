---
type: protocol
title: "OT-2 HMW DNA Pipette Shearing for PacBio HiFi"
---

# OT-2 HMW DNA Pipette Shearing for PacBio HiFi


## Resources

**Equipment:** [[femtopulse]], [[nanodrop]], [[opentrons-ot2]], [[ot2-temperature-module]], [[ph-meter]], [[qubit-fluorometer]]

**Kits:** [[qubit-dsdna-hs-assay-kit]]

**Reagents:** [[nuclease-free-water]]

**Consumables:** [[dna-lobind-tubes]], [[kingfisher-deepwell-96-plate]], [[qubit-assay-tubes]], [[wide-bore-filter-tips-p1000]], [[wide-bore-filter-tips-p200]]

**Related Protocols:** [[operating-the-ot2]], [[ot2-automated-nbd114-prep]], [[in-house-hifi-shearing-pipeline]], [[pacbio-hifi-sequencing]]

**Contacts:** [[grey-monroe]]

**Purpose:** Shear high-molecular-weight DNA on the [[opentrons-ot2]] to a 15-20 kb mean fragment size suitable for PacBio HiFi SMRTbell library prep. This is the front end of the [[in-house-hifi-shearing-pipeline]] — a pre-Genome-Center diagnostic that lets the lab catch over- and under-shearing in hours instead of weeks before committing samples to an expensive Revio run at the [[uc-davis-dna-technologies-core]]. This pipeline **complements**, does not replace, the Genome Center.

**Source:** Adapted from the Sanger Tree of Life [HMW DNA Fragmentation on Opentrons OT-2 — PacBio LI version (12-22 kb)](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-g9cwbz2xf.html). See also the [Opentrons + Psomagen app note](https://insights.opentrons.com/hubfs/App%20Notes/Fragmenting%20High%20Molecular%20Weight%20DNA%20PacBio%20Psomagen_app%20note.pdf) and the [PacBio Hamilton Microlab Prep tech note](https://www.pacb.com/wp-content/uploads/Technical-note-High-throughput-DNA-shearing-using-Hamilton-Microlab-Prep.pdf).

## Background

Pipette shearing fragments DNA by hydrodynamic shear at the tip orifice during repeated aspirate/dispense cycles. The size distribution is controlled by the **tip bore diameter**, **aspirate speed**, and **number of cycles**. The Sanger ToL PacBio LI protocol is tuned for a 12-22 kb target with a narrow distribution and minimal tail above 25 kb — exactly what HiFi library prep wants.

The CybioFelix at the Genome Center is just an automated liquid handler doing the same thing. There is no proprietary chemistry, just a Python protocol on the OT-2.

## Required input

- ≥2 µg HMW DNA per sample
- Normalized to **~5 ng/µL in 300 µL**, all samples in **identical volumes** in a 96-well [[kingfisher-deepwell-96-plate]]
- 260/280 ~1.8-2.0, 260/230 >1.5 by [[nanodrop]]
- Bulk fragment size >30 kb (verify with a quick gel or prior FemtoPulse)
- Quantified on [[qubit-fluorometer]] with [[qubit-dsdna-hs-assay-kit]]

> **Critical:** the lab Qubit reads ~half of the Genome Center Qubit. This was the root cause of the PB1361 oversharing incident. Run HS + BR cross-checks on a few samples per batch and document the offset before normalizing. When in doubt, dilute slightly more conservatively — under-shearing is recoverable, over-shearing is not.

## Required materials

### Equipment
- [[opentrons-ot2]] with [[ot2-temperature-module]] (GEN2)
- [[qubit-fluorometer]] (input QC)
- [[nanodrop]] (purity QC)

### Consumables
- [[wide-bore-filter-tips-p200]] — **mandatory**, narrow tips re-shear samples
- [[wide-bore-filter-tips-p1000]] — **mandatory**
- [[kingfisher-deepwell-96-plate]] (2 mL deep well, ThermoFisher 95040450)
- [[dna-lobind-tubes]] for aliquots
- [[qubit-dsdna-hs-assay-kit]]
- [[qubit-assay-tubes]]
- [[nuclease-free-water]]

## Procedure

### 1. Pre-shearing QC

1. Quantify each sample on the [[qubit-fluorometer]] with the [[qubit-dsdna-hs-assay-kit]]. Record concentrations.
2. Run a [[nanodrop]] purity scan. Reject anything with 260/280 <1.7 or 260/230 <1.0.
3. Confirm bulk fragment size >30 kb (rapid pulse-field gel or prior FemtoPulse trace if available).
4. **Cross-check the Qubit reading.** Use the BR kit on 2-3 representative samples and compare. If the lab Qubit is reading low, scale your dilution accordingly.

### 2. Normalize

1. Dilute each sample to **5 ng/µL** in **300 µL** total volume in [[nuclease-free-water]] in a [[kingfisher-deepwell-96-plate]].
2. All wells must have the **same volume** (300 µL), even if you have fewer than 24 samples — fill the unused wells with 300 µL water as ballast.
3. Mix gently with [[wide-bore-filter-tips-p1000]] by slow pipetting (5x). Do not vortex HMW DNA.
4. Cover the plate, label, and walk to the [[opentrons-ot2]].

### 3. OT-2 deck setup

Following [[operating-the-ot2]]:

1. Power on the OT-2 and connect via the Opentrons App.
2. Load the protocol Python file (see § Python protocol below).
3. Run Labware Position Check.
4. Place labware on the deck per the App layout:
   - Slot 1: P200 [[wide-bore-filter-tips-p200]] tip rack
   - Slot 2: P1000 [[wide-bore-filter-tips-p1000]] tip rack
   - Slot 4: [[kingfisher-deepwell-96-plate]] with normalized samples
   - Slot 11: trash
5. Confirm wide-bore tips are loaded. **Confirm again.** Standard tips here will destroy the run.

### 4. Run

1. Start the protocol from the App.
2. Walk away. Total run time: **~30-60 min** for a full 24-sample plate.
3. Retrieve the plate when the App reports complete.
4. Spin briefly (~500 rcf, 30 s) to collect droplets.

### 5. Post-shearing aliquot and freeze

1. With [[wide-bore-filter-tips-p1000]], transfer ~5 µL (~25 ng) of each sample into a fresh [[dna-lobind-tubes]] strip for QC. This goes to [[ot2-automated-nbd114-prep]].
2. Transfer the remaining ~295 µL into individually labeled [[dna-lobind-tubes]] and freeze at -20 °C. This is your stockpile for SMRTbell prep ([[pacbio-hifi-sequencing]]) and for re-shearing if QC fails.
3. Log the batch in your lab notebook with date, samples, and any deviations.

## Python protocol

> **TODO:** Pull the Sanger ToL PacBio LI protocol from the [protocols.io page](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-g9cwbz2xf.html), adapt to the lab's deck layout (slot assignments above), verify GEN2 module identifiers per [[operating-the-ot2]] § GEN1 fallback, and commit the `.py` file to `docs/wet-lab/library-prep/protocols/ot2-hmw-shearing.py`. Do not transcribe a fabricated version into this page — the source protocol is the source of truth and should be downloaded fresh and version-pinned in the repo.

The protocol parameters of interest (from the Sanger ToL PacBio LI version):

| Parameter | Value | Effect |
| --- | --- | --- |
| Aspirate speed | ~150 µL/s | Higher = smaller mean fragment |
| Dispense speed | ~150 µL/s | Same |
| Number of cycles | ~20 | More cycles = smaller mean |
| Tip type | Wide-bore P200 | Narrower bore = smaller mean (and re-shears anything that was already sheared) |
| Volume per cycle | 200 µL | |
| Target | 12-22 kb mean | |

If a batch comes back too small (<12 kb), reduce cycles by 5 and rerun on the frozen aliquot. If too large (>25 kb tail), increase cycles by 5.

## Expected output

- Mean fragment size **15-20 kb**
- Narrow distribution within 10-30 kb
- No significant tail above 25 kb
- Yield ~85-95% of input (some loss to tip retention)

Verify by [[ot2-automated-nbd114-prep]] (default) or [[nbd114-multiplexed-flongle-prep]] (fallback) followed by [[flongle-sequencing-and-analysis]] on the QC aliquots. The QC library prep uses **0.6× AMPure XP** throughout — do not change the ratio without re-running the validation phase, because every change shifts the size bias and invalidates the FemtoPulse calibration. See [[in-house-hifi-shearing-pipeline]] § AMPure ratio rules.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Mean fragment too small (<12 kb) | Too many cycles, narrow tips, or aggressive aspirate speed | Reduce cycles by 5, confirm wide-bore tips, lower speed |
| Mean fragment too large (>25 kb) with broad tail | Too few cycles | Increase cycles by 5 |
| Bimodal distribution | Mixed input qualities or partial pre-shearing | Re-extract with fresh prep |
| Yield <50% | Standard tips used somewhere; bead loss; aggressive vortexing | Restart with wide-bore tips, hand-mix only |
| QC histogram looks shifted relative to FemtoPulse | Expected — see calibration in [[in-house-hifi-shearing]] § Validation Phase |

## Safety

Standard wet-lab BSL1. No new hazards beyond routine pipetting.

## See also

- [[operating-the-ot2]]
- [[ot2-automated-nbd114-prep]]
- [[flongle-sequencing-and-analysis]]
- [[in-house-hifi-shearing-pipeline]]
- [[pacbio-hifi-sequencing]]
- Sanger ToL [PacBio LI fragmentation](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-g9cwbz2xf.html)
- Sanger ToL [ONT 30-70 kb fragmentation](https://www.protocols.io/view/sanger-tree-of-life-hmw-dna-fragmentation-opentron-hbifb2kbp.html) (parameter reference)
- [Nematode HMW shearing on OT-2](https://www.protocols.io/view/shearing-of-nematode-hmw-dna-for-hifi-sequencing-d6xy9fpw.html)
