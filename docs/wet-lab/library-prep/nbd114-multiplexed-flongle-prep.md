---
type: protocol
title: "Multiplexed Flongle Library Prep — Manual NBD114.24 (Fallback)"
---

# Multiplexed Flongle Library Prep — Manual NBD114.24 (Fallback)

**Purpose:** Prepare a multiplexed Oxford Nanopore library from up to 24 samples for Flongle sequencing, using the **ligation-based** [[sqk-nbd114-24]] kit. This is the **manual fallback** for the in-house diagnostic pipeline; the default production path is the automated version at [[ot2-automated-nbd114-prep]]. Part of the [[in-house-hifi-shearing-pipeline]].

**Source:** Oxford Nanopore [Ligation Sequencing V14 — Native Barcoding Kit 24 (SQK-NBD114.24)](https://community.nanoporetech.com/docs/prepare/library_prep_protocols/ligation-sequencing-v14-native-barcoding-kit-24/).

## Why this kit (and not the rapid kit)

The [[sqk-nbd114-24]] kit is **ligation-based**: adapters are ligated onto the existing ends of each DNA molecule without any cutting. **Read length on the sequencer equals molecule length**, which is exactly the property we need for any application where the read-length histogram must faithfully report the input fragment-size distribution.

The rapid-barcoding alternative (SQK-RBK114.24) uses **transposase tagmentation** — the MuA transposase simultaneously cuts and tags the DNA. Output read length reflects transposase cut frequency, not input molecule length. It is the **wrong chemistry** for size-faithful sequencing. The original Monroe Lab briefing recommended RBK by mistake; this was corrected. **Always use NBD, not RBK, for shearing QC and anything else in the in-house diagnostic pipeline.**

The 24-plex scheme (barcodes NB01–NB24) supports up to 24 samples per Flongle run, same as the rapid kit, with the same kit price (~$700 / 6 preps).

## When to use this (manual) version vs the automated OT-2 version

- **Default:** [[ot2-automated-nbd114-prep]] — chained Python protocol on the [[opentrons-ot2]], ~30–45 min hands-on, ~5–7 hr wall-clock.
- **Use this manual page when:** the OT-2 is down, the automated protocol has not yet been written/validated, a first-time user wants to understand each step end-to-end, or a single-sample troubleshooting run is needed.

Manual prep is ~3 hours hands-on. Plan accordingly.

## Required input

- 100–200 ng dsDNA per sample (adjust per use case; HMW input can be lower mass because each molecule is long)
- 1–24 samples total
- Quantified on [[qubit-fluorometer]] with [[qubit-dsdna-hs-assay-kit]]

## Required materials

### Equipment
- [[thermocycler]] (for end-prep incubations)
- [[magnetic-rack]]
- [[qubit-fluorometer]]

### Reagents and kits
- [[sqk-nbd114-24]] (Native Barcoding Kit 24 V14 — contains native barcodes NB01–NB24, AMX sequencing adapter, and prep buffers)
- [[nebnext-companion-module-ont]] (bundled NEB end-prep + ligase modules), OR the three standalone NEB modules: [[nebnext-ultra-ii-end-prep]], [[nebnext-quick-ligation-module]], [[neb-blunt-ta-ligase-master-mix]]
- [[ampure-xp-beads]]
- [[nuclease-free-water]]
- [[qubit-dsdna-hs-assay-kit]]
- 70% ethanol (made fresh from [[ethanol-absolute]])

### Consumables
- [[pcr-strip-tubes-0-2ml]]
- [[dna-lobind-tubes]]
- [[wide-bore-filter-tips-p200]]
- [[wide-bore-filter-tips-p1000]]
- [[qubit-assay-tubes]]

## Procedure (manual version — 8 steps)

### 1. Normalize input

Quantify each sample on the [[qubit-fluorometer]] with the [[qubit-dsdna-hs-assay-kit]]. Dilute each to the per-use-case target concentration/volume (see § AMPure ratio rules below — use case determines everything downstream). Mix gently with [[wide-bore-filter-tips-p200]]. Do not vortex HMW DNA.

### 2. End repair and dA-tailing

Per sample in a [[pcr-strip-tubes-0-2ml]]:
- Input DNA (target mass per use case)
- NEBNext Ultra II End Prep reaction buffer
- NEBNext Ultra II End Prep enzyme mix
- Nuclease-free water to 11.5 µL

Mix gently. Incubate on the [[thermocycler]]:
- **20 °C × 5 min**
- **65 °C × 5 min**
- Hold at 4 °C

### 3. AMPure XP cleanup #1

**Bead ratio depends on use case. See § AMPure ratio rules below.** For HiFi shearing QC of 15–20 kb input, use **0.6× AMPure XP**. For Illumina-library QC of ~300–600 bp input, use **1.8× AMPure XP** — but if that is your use case, use [[illumina-library-qc-on-flongle]] instead of this page.

1. Add the specified volume of [[ampure-xp-beads]], mix gently by flicking.
2. Incubate 5 min at RT.
3. Place on [[magnetic-rack]] ~5 min until clear.
4. Remove supernatant.
5. Wash 2× with 200 µL fresh 70% ethanol on the magnet.
6. Air-dry ~30 s. **Do not over-dry** (cracks kill yield).
7. Resuspend in nuclease-free water (per kit protocol), incubate 2 min, return to magnet, transfer eluate.

### 4. Per-sample native barcode ligation

Per sample in a fresh [[pcr-strip-tubes-0-2ml]]:
- End-prepped DNA from step 3
- One unique Native Barcode (NB01–NB24) from [[sqk-nbd114-24]]
- NEB Blunt/TA Ligase Master Mix

Mix gently, incubate **20 min at room temperature**, then heat-inactivate per the ONT protocol. Keep strict barcode-to-sample mapping.

### 5. Pool all 24 barcoded reactions

Combine all barcoded reactions into a single [[dna-lobind-tubes]] tube using [[wide-bore-filter-tips-p200]]. Mix gently by inversion.

### 6. AMPure XP cleanup #2 (pool)

Same bead ratio as step 3 (use-case dependent, see § AMPure ratio rules). This cleanup removes unligated barcodes and prepares the pool for adapter ligation.

### 7. Sequencing adapter ligation

To the cleaned pool, add:
- Native Adapter (AMX) from [[sqk-nbd114-24]]
- NEB Quick T4 Ligase (from [[nebnext-quick-ligation-module]] or the companion module)
- Ligation Buffer from the kit

Mix gently, incubate **20 min at room temperature**.

### 8. AMPure XP cleanup #3 (final library)

Final cleanup of the adapter-ligated pool. **Do not use ethanol for wash here** — use the Short Fragment Buffer (SFB) or Long Fragment Buffer (LFB) from [[sqk-nbd114-24]] per the ONT protocol (LFB for HMW use cases, SFB for short-fragment use cases).

Elute in 15 µL Elution Buffer from the kit. Quantify on [[qubit-fluorometer]]: target is 5–50 ng/µL.

The final library is ready for [[flongle-sequencing-and-analysis]]. Keep on ice and load the Flongle as soon as possible — fresh libraries give better first-minute yield.

## AMPure ratio rules (read before changing ANY bead step)

| Use case | AMPure ratio | Why | Washes | Warning |
| --- | --- | --- | --- | --- |
| HiFi shearing QC (15–20 kb input) | **0.6× AMPure XP** | Cuts at ~1 kb, harmless to HMW fragments, removes unligated barcodes | LFB | Loses 5–30% of >30 kb fragments to incomplete elution — characterize once during validation |
| Native HMW gDNA QC (>20 kb) | **0.6× AMPure XP** | Same as above | LFB | Same high-end loss |
| Plasmid verification (3–15 kb) | 0.6–0.8× | Matched to plasmid size range | LFB or SFB | - |
| Amplicon / T-DNA (1–10 kb) | 0.8× | Matched to amplicon range | SFB | - |
| **Illumina library QC (150–600 bp)** | **1.8× AMPure XP** | Retains fragments down to ~100 bp; 0.6× would discard the smallest inserts and bias long | SFB | **Use [[illumina-library-qc-on-flongle]] instead, NOT this page.** |

**Do not change a bead ratio mid-study without re-validating.** Every change shifts the size bias and invalidates any calibration against the reference trace from [[in-house-hifi-shearing]] § Validation Phase. If you need a different ratio for a new use case, document it as a new protocol variant and run its own calibration.

**AMPure high-end elution inefficiency:** AMPure XP loses 5–30% of >30 kb fragments because they do not elute fully off the beads. This is a constant offset, not noise, and is characterized once during the validation phase.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Yield <2 ng/µL after final cleanup | Over-dried beads, input too low, lost pellet | Check input quant, don't over-dry |
| Library mean shifted small | Wrong AMPure ratio for your use case | Match ratio to fragment size per table above |
| Uneven barcodes after demux | Input quant was off | Re-Qubit every sample before pooling |
| No reads for one barcode | Ligation failed or barcode swap | Track barcode-to-sample mapping carefully |
| Large unclassified bin | Adapter ligation failed | Verify AMX, Quick T4 Ligase, and buffer additions |

## Safety

Standard BSL1. Ethanol is flammable.

## See also

- [[ot2-automated-nbd114-prep]] — the default automated version of this prep
- [[illumina-library-qc-on-flongle]] — short-read library variant, different AMPure ratio
- [[ot2-hmw-shearing]]
- [[flongle-sequencing-and-analysis]]
- [[in-house-hifi-shearing-pipeline]]
- Oxford Nanopore [SQK-NBD114.24 protocol](https://community.nanoporetech.com/docs/prepare/library_prep_protocols/ligation-sequencing-v14-native-barcoding-kit-24/)
