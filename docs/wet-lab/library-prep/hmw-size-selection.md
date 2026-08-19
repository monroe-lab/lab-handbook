---
type: protocol
title: "HMW Library Size Selection"
---

# HMW Library Size Selection

> **Draft — not yet bench-verified.** Written 2026-08-18 from the lab's Fiber-seq
> development record. Confirm every volume and concentration against your own run
> before relying on it. Unresolved values are marked `[VERIFY: ...]`.

## Resources

**Equipment:** [[femtopulse]], [[qubit-fluorometer]]

**Kits:** [[qubit-dsdna-hs-assay-kit]]

**Reagents:** [[ampure-xp-beads]]

**Related Protocols:** [[fiber-seq-master-protocol]], [[ot2-hmw-shearing]], [[pacbio-hifi-sequencing]], [[fiber-seq-hmw-extraction]]

**Contacts:** [[grey-monroe]]

**Purpose:** Decide whether to remove short fragments from a pooled HiFi library before
sequencing, and if so, how. Short fragments load preferentially onto a SMRT Cell, so leaving
them in costs long-read yield; removing them costs DNA, and for Fiber-seq specifically may
discard real biological signal. This page records the decision the lab made, why, and the
reference methods for when the answer flips.

**This is a decision page, not a bench procedure.** The lab does not own a size-selection
instrument. The instrument work happens at the [[uc-davis-dna-technologies-core]].

**Source:** Lab decision recorded in the *Fiber-Seq Experiments - Initial Tests* Google Doc
under *Pooling Fiber-Seq Libraries for Initial Sequencing* (2026); Genome Center LightBench
parameters from [[pacbio-hifi-sequencing]] (Col-0 run, 10/2025–01/2026); Pippin HT parameters
from [PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2516708122).

## Background

**Why short fragments matter on PacBio.** Loading a SMRT Cell is length-biased: shorter
SMRTbell molecules diffuse into zero-mode waveguides more readily than long ones. So a
minority of short molecules by mass can occupy a majority of the ZMWs, and you pay for a cell
that returns mostly short reads. On a platform whose entire advantage is read length, that is
the expensive failure mode.

**High-pass versus bimodal selection.** High-pass selection sets a lower cut-off and keeps
everything above it. Bimodal (band-pass) selection keeps a window with both a lower and upper
bound. HiFi libraries generally want **high-pass** — there is no reason to discard the longest
molecules, and the polymerase read length, not the gel, is what caps the top end.

**Gel-based versus bead-based.** Gel instruments (Pippin HT, LightBench) give a sharp,
tunable cut-off but need substantial input and are lossy. Bead-based selection (AMPure PB) is
a ratio-tuned partition — cheaper, lower-input, and gentler, but with a much softer cut-off.
The published plant Fiber-seq work used both: a gel for the standard library and beads for a
deliberately reduced-input one.

**Why Fiber-seq raises a question ordinary genome sequencing does not.** For a genome
assembly, short fragments are simply junk that dilute the run. For Fiber-seq, the read *is*
the measurement — a short molecule still carries a real m6A accessibility footprint, and it is
not known in advance whether short fragments in a Fiber-seq library are biased toward
particular chromatin states. Discarding them may be discarding data. That is the reason the
lab's first round was left unselected, and it is a genuinely open question, not a
rationalization.

## Required input

A pooled, adapter-ligated SMRTbell library with a [[femtopulse]] trace and a
[[qubit-fluorometer]] concentration. Selection decisions are made from the trace, not from a
guess — you need to see where the short-fragment mass actually is before choosing a cut-off.

> **Critical — the core has a hard input floor.** Per Oanh at the Genome Center, LightBench
> takes a **maximum input volume of 25 µL**, and *"to be on the safe side... please provide a
> minimum of 1 µg in 25 µL."* A pool below that is not a candidate for gel size selection at
> the core at all. This is not hypothetical: on the Col-0 run, Pool 1 came back at
> **11 ng/µL in 22 µL = 253 ng**, explicitly recorded as *"too low for Sequencing & LightBench
> Size Selection."* See [[pacbio-hifi-sequencing]].

Because the maximum volume and the minimum mass are both fixed, the real requirement is a
concentration of **at least 40 ng/µL**. If you are short, concentrate with beads before
submitting rather than sending a larger volume — the core cannot take it.

## Decision point

**Round 1 (Fiber-seq, 2026): size selection was deliberately SKIPPED.**

The recorded reasoning, verbatim from the dev log:

> *"Decided to NOT perform size selection on pooled libraries. As this is my first round
> troubleshooting Fiber-Seq, I think that it would be better to not perform size selection and
> assess whether shorter fragments show any unique accessibility signals. The objective of
> this first round of sequencing is more so to assess the Hia5 labeling conditions for the
> Arabidopsis and Pistachio samples, and I anticipate generating additional libraries to
> sequence at higher depths once I have optimized the conditions for the Fiber-Seq reaction
> and library prep."*

What this means for a reader: **round 1 was a labeling-conditions experiment, not a
yield-optimized production run.** The short fragments were kept on purpose, as data, to test
whether they carry distinct accessibility signal. Deeper libraries were always the plan for
after the reaction conditions were settled.

**Do not read this as a general recommendation to skip size selection.** It was the right call
for a diagnostic first round and is the wrong call for a production run where per-cell HiFi
yield is what you are buying.

`[VERIFY: has round 1 sequencing come back, and did the short fragments in fact show distinct
accessibility signal? The answer determines whether this decision should be repeated or
reversed, and this page should be updated either way.]`

### When to size select instead

| Situation | Select? |
| --- | --- |
| First-pass troubleshooting run; the question is "did labeling work" | **No** — short fragments are informative and the run is not about yield |
| Production run where per-cell HiFi yield matters | **Yes** — short-fragment loading bias is the main thing costing you reads |
| Post-shear trace already narrow, mode already in the target range | **Probably not** — per Noravit, such a library can skip shearing too; see the [[ot2-hmw-shearing]] decision point |
| Prominent peak below the target range | **Yes** — that peak will take a disproportionate share of ZMWs |
| Pool below 1 µg in 25 µL | **Not eligible** for LightBench regardless; concentrate first or accept the unselected run |

## Reference methods

### Genome Center LightBench — the lab's actual route

The lab's Col-0 HiFi pools went to the Genome Center for LightBench size selection and
sequencing. Recorded parameters from that run:

| Parameter | Value | Source |
| --- | --- | --- |
| Maximum input volume | 25 µL | Oanh, Genome Center |
| Minimum input mass | 1 µg in 25 µL | Oanh, Genome Center |
| Cut-off used | < 12 kb removed | [[pacbio-hifi-sequencing]] |
| Pool at submission | 48 ng/µL in 25 µL (= 1.2 µg), mean 19,772 bp, mode 18,150 bp | [[pacbio-hifi-sequencing]] |

Note the submitted pool cleared the 1 µg floor with only 200 ng to spare, and getting there
required concentrating two pools onto beads into 25 µL. Plan for that step rather than
discovering it at submission.

> `[VERIFY: "Oanh" appears in the handbook by first name only. Get the full name and confirm
> the current Genome Center contact for size selection before this page is treated as a
> directory entry.]`

### Pippin HT — the PNAS 2025 published method

The published plant Fiber-seq libraries were size-selected on a Pippin HT after shearing,
damage repair, end repair, hairpin adapter ligation, and purification:

| Parameter | Value |
| --- | --- |
| Cassette / protocol | 0.75% Agarose 15-20kb high-pass 75E |
| Range start | 15,000 bp |
| Range end | 50,000 bp |
| Result | 15 kb HiFi library, sequenced on PacBio Revio |

The same paper prepared a **10 kb library from reduced input** using **AMPure PB bead** size
selection instead of a gel. That is the low-input alternative when there is not enough
material to meet a gel instrument's minimum — which, given the 1 µg floor above, is a
situation this lab has already hit once.

> `[VERIFY: does the UC Davis DNA Technologies Core run a Pippin HT, or is LightBench the only
> gel option available to the lab? These are different instruments with different cassettes,
> and the Pippin parameters above should not be assumed to be directly orderable here.]`

## Procedure

There is no in-lab bench procedure. The steps are:

1. QC the pooled library on [[femtopulse]] and [[qubit-fluorometer]]. You need both the size
   distribution and an accurate mass.
2. Decide from the trace using the table above.
3. If selecting, confirm the pool meets the core's input minimum (1 µg in ≤25 µL); concentrate
   on beads if it does not.
4. Submit to [[uc-davis-dna-technologies-core]] specifying the cut-off.
5. Record the pre- and post-selection traces and concentrations on the run's notebook page.

## Expected output

A pool whose distribution has no prominent peak below the cut-off, with enough mass remaining
to sequence. **Record the loss.** Gel selection is lossy, and the post-selection Qubit is the
number that decides whether the run is still viable — a successful selection that leaves you
under the sequencing minimum is not a success.

`[VERIFY: typical recovery through LightBench is not recorded anywhere in the handbook. Record
it on the next selected run so this page can state a real expectation.]`

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Pool too dilute for the core's minimum | Low library yield upstream | Concentrate onto beads into 25 µL (what was done for the Col-0 merged pool), or pool more samples. If neither is possible, sequence unselected rather than not at all |
| Wide size distribution across pooled samples | Inconsistent shearing or extraction between samples | Per [[pacbio-hifi-sequencing]], variable fragment size reduces read quality and yield. Match distributions before pooling, not after |
| Large short-fragment peak remains after selection | Cut-off set too low, or the peak sits above the cut-off | Re-examine the post-selection trace against the cut-off actually used; a 12 kb cut-off does nothing about a peak at 14 kb |
| Low recovery after selection | Normal gel loss, compounded by low input | Expected; this is why the input floor exists. Budget mass for it up front |

## Safety

No lab hazards — all instrument work is done at the core.

## See also

- [[fiber-seq-master-protocol]] — the hub
- [[ot2-hmw-shearing]] — the shear-or-skip decision that precedes this one
- [[fiber-seq-hmw-extraction]] — where the length distribution is actually determined
- [[pacbio-hifi-sequencing]] — the lab's LightBench submission record
- [[fiber-seq-development-log]]
