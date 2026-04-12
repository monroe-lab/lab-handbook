---
type: protocol
title: "Nanopore Rapid Library Prep"
---

# Nanopore Rapid Library Prep

## Resources

**Equipment:** [[centrifuge|Microcentrifuge]], [[heat-block]] (30C), [[magnetic-rack]], [[vortex-mixer]], [[minion-mk1b|MinION device]]

**Reagents:** [[nanopore-rapid-sequencing-kit|Oxford Nanopore Rapid Sequencing Kit]] (SQK-RAD114 or current version), HMW DNA sample, [[nuclease-free-water]]

**Consumables:** [[pcr-strip-tubes-0-2ml]], [[dna-lobind-tubes]]

**Related Protocols:** [[quantifying-dna-qubit]], [[loading-a-minion-flow-cell]], [[nanopore-data-retrieval]]

**Prerequisites:** HMW DNA (from any Tier 7 HMW extraction method), quantified by Qubit

**Purpose:** Prepare a nanopore sequencing library from HMW DNA using Oxford Nanopore's Rapid Sequencing Kit. The rapid kit uses a transposase to fragment DNA and attach sequencing adapters in a single step, minimizing hands-on time and preserving read length.

## Time estimate

**Wall time:** ~1.5-2 hr | **Hands-on:** ~45 min

---

## Before You Start

Check that you have:

- [[nanopore-rapid-sequencing-kit|Rapid Sequencing Kit]] (check expiration date; store at [[freezer-minus20|-20C]])
- HMW DNA: **400 ng minimum** in a volume of 7.5 uL or less. Concentration should be at least ~50 ng/uL.
- Qubit reading from [[quantifying-dna-qubit]] to calculate input volume
- [[nuclease-free-water]]
- [[magnetic-rack]] for 1.5 mL tubes

If the kit is running low or expired, mark as needs-ordering in the [inventory system](../inventory-app/index.html).

**Equipment needed but not yet in the lab:** The MinION device and flow cells need to be purchased. See Grey for the ordering plan.

## Background

The Rapid Sequencing Kit is the simplest Oxford Nanopore library prep. A transposase enzyme cleaves the DNA and simultaneously attaches sequencing adapters to the cut ends. This "tagmentation" approach:

- Requires minimal input (as low as 200-400 ng depending on kit version)
- Takes ~10-15 minutes of hands-on time
- Preserves long reads (median read length depends on input DNA quality)
- Does not require PCR amplification (fewer biases)

The trade-off vs. the Ligation Kit: the rapid kit wastes ~50% of input DNA (transposase cuts are random, so some fragments lose their adapters). The ligation kit attaches adapters to every fragment end without cutting, giving higher yield from the same input. But the ligation kit takes ~2 hours and requires more steps. For training and most lab applications, the rapid kit is preferred.

<!-- PHOTO: Rapid Sequencing Kit contents laid out -->

## Procedure

**Follow the Oxford Nanopore protocol document** included with the kit or available at [nanoporetech.com](https://nanoporetech.com). Kit versions change; the steps below are a general guide for the rapid kit workflow.

### 1. Calculate DNA input

From your Qubit reading, calculate the volume needed for 400 ng of DNA:

```
Volume (uL) = 400 ng / concentration (ng/uL)
```

Example: if your DNA is 80 ng/uL, you need 5 uL.

If the required volume is more than 7.5 uL, you need to concentrate your DNA first (SpeedVac or SPRI bead concentration).

### 2. Tagmentation

1. In a 0.2 mL [[pcr-strip-tubes-0-2ml|PCR tube]], combine:
   - X uL HMW DNA (400 ng)
   - Nuclease-free water to bring total to 7.5 uL
   - 2.5 uL **Fragmentation Mix (FRA)**
2. Flick to mix gently. **Do not vortex HMW DNA.**
3. Pulse spin.
4. Incubate at **30C for 1 minute** in the [[heat-block]].
5. Immediately incubate at **80C for 1 minute** (heat-kills the transposase).
6. Place on ice.

### 3. Add adapter

1. Add **1 uL Rapid Adapter (RAP)** to the tagmented DNA.
2. Flick gently to mix. Pulse spin.
3. Incubate at **room temperature for 5 minutes**.

### 4. Library is ready

The library (~11 uL) is now ready to load onto a flow cell. Proceed immediately to [[loading-a-minion-flow-cell]].

**Do not freeze the library.** Adapters can detach during freeze-thaw. Load within 1-2 hours.

## Troubleshooting

| Problem | Possible cause | Solution |
|---------|---------------|----------|
| Low pore occupancy after loading | Insufficient library, or adapters didn't attach | Check DNA input amount. Ensure FRA and RAP were added. |
| Very short reads | Input DNA was already fragmented | Check DNA integrity before library prep (pulse-field gel or Femtopulse if available). Use gentler handling during extraction. |
| No reads at all | Flow cell issue, not library issue | See [[loading-a-minion-flow-cell]] troubleshooting |

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Note:

- Input DNA: genotype, extraction method, Qubit concentration, volume used, total ng input
- Kit lot number and expiration date
- Any deviations from the protocol
- Proceed to [[loading-a-minion-flow-cell]] and document the run there
