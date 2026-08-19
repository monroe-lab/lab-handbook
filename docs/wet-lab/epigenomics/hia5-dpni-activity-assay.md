---
type: protocol
title: "Hia5 DpnI Activity Assay"
---

# Hia5 DpnI Activity Assay

> **Draft — not yet bench-verified.** Written 2026-08-18 from the lab's Fiber-seq
> development record. Confirm every volume and concentration against your own run
> before relying on it. Unresolved values are marked `[VERIFY: ...]`.

## Resources

**Equipment:** [[thermocycler]], [[gel-electrophoresis-tank|gel electrophoresis tank]], [[uv-transilluminator|gel imager]]

**Reagents:** [[dpni]], [[rcutsmart-buffer]], [[s-adenosylmethionine]], [[agarose]], [[lambda-dna-standard]]

**Consumables:** [[pcr-strip-tubes-0-2ml]], [[wide-bore-filter-tips-p200]]

**Related Protocols:** [[fiber-seq-hia5-labeling]], [[fiber-seq-master-protocol]], [[gel-electrophoresis]], [[making-an-agarose-gel]], [[gel-imaging-and-annotation]]

**Contacts:** [[grey-monroe]]

**Purpose:** Answer one question: **does this Hia5 enzyme lot actually methylate adenine?**
DpnI cuts GATC only when the adenine is methylated, so a methylated sample gets chopped to
a smear and an unmethylated one stays high molecular weight. Run this on every new protein
batch before committing it to a Fiber-seq experiment, and on extracted Fiber-seq DNA to
confirm labeling worked before sequencing.

This assay is deliberately **not** Fiber-seq-specific. It is the lab's generic "did this
MTase work" gel.

**Source:** Adapted from the protocols.io method for testing nanobody-Hia5 fusions
(`g3iibykcf`) `[VERIFY: resolve the full protocols.io URL and title before publishing]`;
lab implementation in the *Fiber-Seq Experiments - Initial Tests* Google Doc,
*Fiber-Seq Experiments* tab, entries dated 03.06 / 03.16 / 03.25 / 03.30.2026.

## Background

Hia5 is a methyltransferase, and the cheapest possible way to ask whether a methyltransferase
worked is to hand the DNA to an enzyme that only cuts methylated sites.

**DpnI is that enzyme.** It recognizes `GATC` but will only cut when the adenine in that site
carries the N6-methyl group. This is the same logic DamID is built on. So:

- **DNA that Hia5 methylated** → many GATC sites now carry m6A → DpnI cuts at all of them →
  the high-molecular-weight band collapses into a low smear.
- **DNA that Hia5 did not methylate** → DpnI has nothing to cut → the DNA stays high
  molecular weight and looks identical to the untreated input.

A gel is a sufficient readout because the question is binary. You are not measuring how much
m6A there is (that comes later, from the sequencing kinetics — see [[fiber-seq-master-protocol]]).
You are asking whether the enzyme is alive. A dead enzyme and a working enzyme give visibly
different lanes, and no quantification is needed to tell them apart.

**The 601 sequence.** The source protocol also uses a 147 bp artificial nucleosome-positioning
sequence ("601") wrapped into artificial chromatin. Because a nucleosome physically occludes
the DNA it wraps, the 601 region shows **protection from methylation**. That is the same
footprinting principle Fiber-seq depends on, tested in a defined single-nucleosome system.
For the [Anchor Tag](../../projects/anchor-tag/index.md) fusion constructs it also raises the
open question recorded in the dev log: if nucleosomes block methylation, can a targeted
Hia5 fusion still map histone modifications at the nucleosome it is recruited to? The
recorded plan was to compare m6A/A for free Hia5 versus antibody-directed Hia5 in regions
that are and are not nucleosome-protected. `[VERIFY: was the 601 / artificial chromatin arm
ever actually run? Only the naked-HMW-DNA version appears in the results tables.]`

**Two functions, only one tested here.** The fusion constructs need to do two things:
(1) methylate, and (2) bind their target through the fused domain. **This assay only tests
(1).** Target binding has to be tested separately — the dev log proposes a DiMeLo-seq-style
experiment for that, which has not been run.

## Time estimate

1 h MTase treatment + 1 h DpnI digestion + ~45 min gel run, plus gel pouring and imaging.
Half a day.

## Required input

100–150 ng HMW DNA per reaction. Two routes:

- **Testing an enzyme lot:** clean HMW gDNA, or ONT bacterial lambda DNA
  ([[lambda-dna-standard]]) as in the original protocol (2 µL of 50 ng/µL = 100 ng).
- **Confirming a Fiber-seq run:** a small aliquot of the extracted, already-labeled
  Fiber-seq DNA. In this case you digest **without** adding fresh MTase — the labeling
  already happened in the nuclei. This is what the 03.30.2026 verification of the
  03.25.2026 Fiber-seq samples did, at 50 ng input per reaction.

## Required materials

### Reaction components

| Component | Amount |
| --- | --- |
| HMW DNA | Volume giving 100–150 ng per reaction |
| Purified (protein)-Hia5 | Titrate 25 / 50 / 100 nM in a 20 µL MTase reaction |
| [[s-adenosylmethionine]] | 160 µM final — 1 µL of 32 mM stock into 200 µL activation buffer |
| 1× [[rcutsmart-buffer]] digestion buffer | 12 µL of 10× + 108 µL H₂O (make one extra reaction's worth) |
| [[dpni]] | 1 µL per reaction |

The lab's SAM is **New England Biolabs B9003S, 32 mM**, the same stock used for the labeling
reaction.

> **Critical — do not "reconcile" the two SAM concentrations.** This assay uses **160 µM**
> SAM. The Fiber-seq labeling reaction uses **800 µM** (see [[fiber-seq-hia5-labeling]]).
> They differ on purpose, and the source doc calls the difference out explicitly rather than
> treating it as an error. Do not edit one to match the other.

### Activation buffer

This assay uses the same activation buffer as the labeling reaction, with SAM added to
160 µM instead of 800 µM.

> **Critical — spermidine discrepancy.** The activation buffer table printed alongside this
> assay lists spermidine at **0.05 mM final**, while the buffer table on the *Protocol* tab
> lists **0.5 mM final** — a genuine 10× difference. Both tables are internally
> self-consistent (their stock-to-volume arithmetic checks out at their own stated target),
> so this is a difference in the intended concentration, not a dilution-math slip.
> See [[fiber-seq-hia5-labeling]], where the same conflict is flagged.
> `[VERIFY: which spermidine concentration was actually used on the bench, and which is
> correct? This has never been resolved in the dev log.]`

## Procedure

### 1. MTase treatment

Prepare **200 µL of activation buffer**, adding SAM to a final concentration of **160 µM**
(1 µL of 32 mM stock). Treat the HMW DNA in **20 µL** of this buffer at **37 °C for 1 h**,
testing the enzyme at **25, 50, and 100 nM**.

Skip this step entirely if you are verifying already-labeled Fiber-seq DNA.

> **Note the conditions are deliberately harsher than a Fiber-seq run.** This assay runs
> 37 °C for 1 h; the labeling reaction runs 25 °C for 10 min. The assay is trying to
> saturate the DNA to get an unambiguous gel, not to hit the 5–7% m6A window that Fiber-seq
> needs. Do not carry these conditions over into a labeling reaction.

### 2. Prepare digestion buffer

During the MTase incubation, make 1× [[rcutsmart-buffer]] (older CutSmart also works):
**12 µL of 10× + 108 µL H₂O** per four reactions. Make one reaction extra so you do not run
short on the last tube.

### 3. Digest

Add **30 µL of digestion buffer and 1 µL of [[dpni]]** per reaction. Mix with a
**wide-bore tip** — the point of the assay is to detect fragmentation, so shearing the input
with a narrow tip corrupts the readout. Incubate at **37 °C for 1 h**.

For the no-digestion negative control, add rCutSmart alone with no DpnI.

### 4. Gel

Pour a **1% agarose** gel during the digestion incubation. Run at **120 V for 45 min**,
loading as much of each sample as the well takes. See [[making-an-agarose-gel]],
[[gel-electrophoresis]], and [[gel-imaging-and-annotation]].

### 5. Lane layout

| Lane | Contents |
| --- | --- |
| 1 | Original DNA input |
| 2 | Negative control, no DpnI |
| 3 | Negative control, with DpnI |
| 4 | 25 nM MTase + DpnI |
| 5 | 50 nM MTase + DpnI |
| 6 | 100 nM MTase + DpnI |

Lanes 1–3 are the controls that make the experiment interpretable. Lane 3 in particular is
the one that catches endogenous or contaminating methylation — do not drop it to save wells.

## Expected output

Lanes 1 and 2 should look the same: high molecular weight, undigested. Lane 3 should also stay
high molecular weight if the DNA carries no pre-existing m6A. Lanes 4–6 should show
progressively shorter fragments.

**Complete digestion of HMW DNA at 25 nM indicates high enzyme activity.**

## Interpreting results — the lab's record

This section records what the lab has and has not established. It is easy to read the dev log
as saying more than it does.

- **03.30.2026, verbatim from the source doc:** *"ONLY Tudor-Hia5 reactions did not
  successfully methylate adenine."* Round-1 Tudor-Hia5 **failed**. The word "ONLY" implies
  free Hia5, pA-Hia5, 3ATudor-Hia5 and the Epicypher control all worked in that run, but the
  doc records **no individual verdict** for any of them, and no images were interpreted
  construct by construct.
- **pAG-Hia5 has no written verdict anywhere.** It was not in the 03.30.2026 validation run
  at all. It appears only in an undated titration table and the 03.16.2026 timecourse — gels
  that were run and photographed but never given a conclusion in text.
- **A separate 03.30.2026 note, *"Samples are successfully methylated,"* is about a different
  experiment.** It refers to the verification of the 03.25.2026 Fiber-seq samples
  (FS_1, FS_2, FS_6, FS_10, FS_10S), which were labeled with **Epicypher Hia5 in nuclei** and
  contain no Tudor construct. **Do not conflate these two sentences.** Conflating them is how
  the lab's notes previously ended up recording the Tudor result backwards.
- **Round-2 Tudor-Hia5 (June 2026, MBP-fused, ~70% purity) has never been scored.** Setup was
  documented 06.14.2026 and a gel was run and photographed, but never interpreted.
  `[VERIFY: score the June 2026 gel, or record explicitly that it is unscored.]`

> **Critical:** The only Hia5 the lab can currently claim as validated for production
> Fiber-seq is [[epicypher-cutana-hia5]]. Every
> [Anchor Tag](../../projects/anchor-tag/index.md) construct is a project-stage reagent.
> The full construct-by-construct verdict table lives on [[fiber-seq-master-protocol]] —
> that is the single place it is maintained.

### Two things that complicate the 03.30 Tudor-Hia5 verdict

Neither of these overturns the result. Both mean it should be re-run before "Tudor-Hia5 does
not methylate" is treated as a settled property of the construct.

**1. The proteins were dosed by total mass, not by active enzyme.** The 03.30 note records
*"Added 0.034ng of each protein stock per reaction"* and *"Used 11.72ul of the protein
stock."* Equal total protein mass across constructs whose stocks range from **<30% to 95%
purity** means the actual amount of Hia5 delivered differed by more than 3× between tubes.
Tudor-Hia5 (<30% pure) received less than a third the active enzyme that pA-Hia5 (95% pure)
did. The nM Stock column in the protein table below is computed from **total** protein
concentration and is **not** purity-corrected, so it does not close this gap either.

> `[VERIFY: was the 03.30 dosing intended to be equal total mass, or equal active enzyme?
> If equal mass, the Tudor-Hia5 failure is confounded with its low purity and the comparison
> should be repeated at matched active-enzyme input before the construct is written off.]`

**2. The recorded unit is wrong — it must be 0.034 µg, not 0.034 ng.** The two numbers in the
note only agree at µg: 0.034 µg ÷ 0.0029 µg/µL (= 0.0029 mg/mL, the Tudor-Hia5 and free Hia5
stock concentration) = **11.72 µL**, exactly the volume recorded. At 0.034 **ng** the volume
would be 0.0117 µL, a thousand-fold smaller and unpipettable. Read the entry as **0.034 µg
(34 ng) of total protein per reaction**, and read the follow-up option *"increase 0.034 →
0.05"* in the same units.

> `[VERIFY: confirm against Vianney's bench notebook, which the entry says holds the exact
> volumes used. The µg reading is arithmetic on the doc's own numbers, not a bench record.]`

### Protein stock reference (03.06.2026)

| Name | Conc (mg/mL) | Purity (%) | nM stock |
| --- | --- | --- | --- |
| Hia5 * | 0.0029 | <30 | 81.69 |
| pA-Hia5 | 0.038 | 95 | 720.58 |
| pAG-Hia5 | 0.068 | 85 | 1133.28 |
| Tudor-Hia5 * | 0.0029 | <30 | 65.33 |
| 3ATudor-Hia5 | 0.028 | 70 | 635.04 |
| [[epicypher-cutana-hia5]] | Not stated | Not stated | Not stated |

`*` In the source table these two carry the footnote *"omitted for now, due to lack of
protein stock…"* — meaning they were left out of the **03.06.2026** titration, not that they
were never tested. Both were run in the 03.30.2026 validation. Do not read the asterisk as a
permanent exclusion.

The Epicypher enzyme's concentration is **unknown** — it is not disclosed on the product
sheet. This is why the lab doses it by volume (2 µL of stock per 1 million nuclei) rather
than by molarity, and why it cannot be placed on a nM titration alongside the in-house
constructs.

> `[VERIFY: unresolved conflict — round-1 Tudor-Hia5 yield is recorded as 0.0029 mg/mL,
> <30% purity in this table, but <0.01 mg/mL, <0.06 mg total, purity N/A in the Anchor Tag
> protein record read from the GenScript order report. Same conclusion, different numbers.
> Reconcile against the CoA before either number is quoted elsewhere.]`

### Dosing note carried over from the labeling protocol

The dev log records the cross-protocol comparison, which is useful when deciding what
concentration to titrate:

- Fiber-seq working amount: **2 µL of Hia5 stock per 1 million nuclei**, in a 60 µL reaction
  for 10 min.
- DiMeLo-seq recommends **200 nM in 200 µL** for 1–5 million nuclei. The 50 nM point in this
  assay is ¼ of that.
- The log's own inference: if Fiber-seq behaves like ATAC-seq, DiMeLo-seq requires a
  **higher** Hia5 input than Fiber-seq does. `[VERIFY: this is reasoning in the dev log, not
  a measured result.]`

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No digestion in any MTase lane | Dead SAM, dead enzyme, or wrong buffer | SAM is highly labile and degrades with freeze/thaw — use a fresh aliquot before suspecting the enzyme. Confirm the digestion buffer is rCutSmart and that DpnI actually went in |
| No digestion, but SAM and buffer are known good | Genuinely low enzyme activity | The options recorded 03.30.2026: increase enzyme (0.034 → 0.05 µg per reaction, or more), increase incubation time, or both. If the stock is low-purity, match on active enzyme rather than total mass |
| Negative control (lane 3) also digested | Endogenous m6A in the input, or Hia5 carryover contamination | Check whether the source DNA could already be methylated. For Arabidopsis the dev log flags checking existing HiFi data for endogenous 6mA as an open task |
| Partial digestion only at 100 nM | Low enzyme activity | Same options as above; also verify the stock concentration used in the nM calculation |
| Input lane already smeared | Shearing during handling | Use wide-bore tips throughout; do not vortex |

## Safety

Standard BSL1. Gel stain handling and UV or blue-light imaging per
[[gel-imaging-and-annotation]] — use blue light where possible and wear a face shield with UV.

## See also

- [[fiber-seq-hia5-labeling]] — the labeling reaction this assay validates the enzyme for
- [[fiber-seq-master-protocol]] — the hub, and the maintained construct verdict table
- [Anchor Tag](../../projects/anchor-tag/index.md) — the Hia5 fusion construct project
- [[fiber-seq-development-log]]
