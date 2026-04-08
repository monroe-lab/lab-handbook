---
type: protocol
title: "OT-2 Automated NBD114.24 Library Prep (Default)"
---

# OT-2 Automated NBD114.24 Library Prep (Default)

**Purpose:** The **default production** library prep for the in-house Flongle diagnostic pipeline. A single chained Python protocol on the [[opentrons-ot2]] runs steps 2–8 of the [[sqk-nbd114-24]] workflow unattended, using the [[ot2-temperature-module]] and [[ot2-magnetic-module]]. Target: **~30–45 min hands-on, ~5–7 hr wall-clock** from frozen DNA to adapter-loaded library. Part of the [[in-house-hifi-shearing-pipeline]]. Manual fallback: [[nbd114-multiplexed-flongle-prep]].

**Source:** Adapted from the Oxford Nanopore [Ligation Sequencing V14 — NBD24 protocol](https://community.nanoporetech.com/docs/prepare/library_prep_protocols/ligation-sequencing-v14-native-barcoding-kit-24/) and community OT-2 ports of ligation-based nanopore prep. See § Python protocol below for reference implementations to adapt.

## Why automate this

Manual NBD114.24 prep takes ~3 hours hands-on. At that friction level, the lab defaults back to shipping samples to the Genome Center and the in-house diagnostic pipeline dies. The OT-2 can handle **every** wet step of the NBD114.24 prep, so the right move is full automation as the default.

Hands-on time target:

- ~15 min loading the deck (samples, reagents, beads, tips, plates)
- ~5 min taking the final library off the deck and Qubiting it
- ~15 min loading and launching the Flongle ([[flongle-sequencing-and-analysis]])

**Total: ~30–45 min hands-on, ~5–7 hr wall-clock, same-day verdict.**

## Step → OT-2 capability mapping

| Step | Action | OT-2 capability |
|---|---|---|
| 1. Normalize input DNA concentrations | Dilute per-sample from CSV of concentrations | Standard pipetting |
| 2. End-repair + dA-tail (20 °C × 5 min, 65 °C × 5 min) | NEBNext Ultra II End Prep | Pipetting + [[ot2-temperature-module]] |
| 3. AMPure XP cleanup #1 | Bead cleanup post end-prep | [[ot2-magnetic-module]] |
| 4. Per-sample native barcode ligation (20 min RT) | Blunt/TA Ligase | Pipetting + ambient incubation |
| 5. Pool all 24 barcoded reactions | Consolidation into one tube | Trivial pipetting |
| 6. AMPure XP cleanup #2 (pool) | Bead cleanup post ligation | [[ot2-magnetic-module]] |
| 7. Sequencing adapter ligation (20 min RT) | Quick T4 Ligase + AMX | Pipetting + ambient incubation |
| 8. AMPure XP cleanup #3 (final library) | Final bead cleanup with LFB/SFB | [[ot2-magnetic-module]] |

Steps 1–8 should be chained into a **single Python protocol** that runs unattended end-to-end.

## Required input

- 1–24 samples in a normalized [[kingfisher-deepwell-96-plate]] or 96-well PCR plate (step 1 can either be a pre-step at the bench or the first action of the chained protocol — choose when writing the `.py`)
- Per-use-case input mass target (see [[nbd114-multiplexed-flongle-prep]] § AMPure ratio rules)
- Concentrations recorded in a CSV the protocol ingests

## Required materials

### Equipment
- [[opentrons-ot2]] with [[ot2-temperature-module]] (GEN2) and [[ot2-magnetic-module]] (GEN2)
- [[qubit-fluorometer]] (off-deck, for final library quant)

### Reagents
- [[sqk-nbd114-24]]
- [[nebnext-companion-module-ont]] (or standalone [[nebnext-ultra-ii-end-prep]], [[nebnext-quick-ligation-module]], [[neb-blunt-ta-ligase-master-mix]])
- [[ampure-xp-beads]]
- [[nuclease-free-water]]
- 70% ethanol (made fresh from [[ethanol-absolute]])

### Consumables
- [[wide-bore-filter-tips-p200]]
- [[wide-bore-filter-tips-p1000]]
- [[pcr-strip-tubes-0-2ml]] or 96-well PCR plate
- [[dna-lobind-tubes]]
- [[kingfisher-deepwell-96-plate]] for the input/normalization plate
- [[qubit-dsdna-hs-assay-kit]] and [[qubit-assay-tubes]]

## Deck layout

TBD when the Python protocol is finalized. Placeholder slot assignments:

- Slot 1: P200 [[wide-bore-filter-tips-p200]] rack
- Slot 2: P1000 [[wide-bore-filter-tips-p1000]] rack
- Slot 3: [[ot2-temperature-module]] with aluminum block holding the sample strip/plate
- Slot 4: [[ot2-magnetic-module]] with AMPure-compatible plate
- Slot 5: Reagent reservoir (AMPure, ethanol, nuclease-free water, LFB/SFB, EB)
- Slot 6: Barcode strip from [[sqk-nbd114-24]]
- Slot 11: Trash

Run Labware Position Check per [[operating-the-ot2]] before every run.

## AMPure ratio

**The AMPure ratio in the Python protocol is locked to the intended use case.** For the default HiFi shearing QC use case, all three AMPure cleanups use **0.6× beads** to match 15–20 kb input. If you need a different ratio for a different use case (e.g., 1.8× for Illumina library QC), write and validate a **separate Python protocol file** — do not reuse one that was calibrated at a different ratio. See [[nbd114-multiplexed-flongle-prep]] § AMPure ratio rules and [[illumina-library-qc-on-flongle]].

AMPure XP loses 5–30% of >30 kb fragments to incomplete elution. Characterize this once during [[in-house-hifi-shearing]] § Validation Phase.

## Python protocol

> **TODO:** write and commit the chained protocol as `docs/wet-lab/library-prep/protocols/ot2-nbd114-flongle-prep.py`. Do **not** fabricate a protocol in this page — pull the source from the references below, adapt to the lab's deck, verify GEN2 module identifiers per [[operating-the-ot2]] § GEN1 fallback, and version-pin.

**Reference starting points** (check these in order before writing from scratch):

1. **protocols.io** — search for "OT-2 nanopore native barcoding" and "OT-2 NBD114" community protocols. <https://www.protocols.io/>
2. **Opentrons Protocol Library** — <https://protocols.opentrons.com/> — filter by "nanopore" or "ligation sequencing".
3. **Hamilton Microlab Prep reference protocol for ligation-based ONT prep** — PacBio and ONT both publish Hamilton technical notes that cover the exact same chemistry; the liquid-handling logic transfers to OT-2 with minor pipette/labware changes. Start from: <https://www.pacb.com/wp-content/uploads/Technical-note-High-throughput-DNA-shearing-using-Hamilton-Microlab-Prep.pdf> (for comparable liquid-handling parameters).
4. **Sanger Tree of Life OT-2 protocols** — already the source for [[ot2-hmw-shearing]]. They also publish downstream ONT library prep automation. <https://www.protocols.io/workspaces/tol>

Adapt rather than write from scratch. A working community version cuts weeks of debugging.

## Operating procedure (once the Python protocol is in place)

1. Thaw reagents on ice per the ONT kit manual.
2. Load the deck per § Deck layout.
3. Upload the protocol via the Opentrons App, run Labware Position Check ([[operating-the-ot2]]).
4. Start the run. Walk away.
5. At the end (~5–7 hr), retrieve the final library from the magnet slot, quant on [[qubit-fluorometer]], log the concentration.
6. Proceed immediately to [[flongle-sequencing-and-analysis]].

## See also

- [[nbd114-multiplexed-flongle-prep]] — manual fallback
- [[illumina-library-qc-on-flongle]] — short-read variant at 1.8× AMPure
- [[ot2-hmw-shearing]]
- [[operating-the-ot2]]
- [[flongle-sequencing-and-analysis]]
- [[in-house-hifi-shearing-pipeline]]
