---
type: protocol
title: "Hia5 Enzyme Activity Test (in vitro)"
---

# Hia5 Enzyme Activity Test (in vitro)

> **Draft — not yet bench-verified.** Confirm every volume and concentration against your own
> run before relying on it. Unresolved values are collected under § Notes, open questions and
> sources.

**What this does.** Answers one question about a tube of purified protein: **does this Hia5
prep methylate adenine at all?** Purified enzyme, naked HMW DNA, SAM, one hour at 37 °C.

**When to run it.** On every new protein lot before committing it to a Fiber-seq experiment,
and whenever you want to compare [[hia5-protein-stocks|constructs]] against each other.

**Time:** 1 h reaction, then hand off to [[dpni-methylation-check]] (1 h digest + ~45 min gel).
Half a day end to end.
**Input:** purified Hia5 or Hia5-fusion protein, 100 ng clean HMW DNA per reaction, fresh SAM.

> **This page is the reaction. The readout lives on [[dpni-methylation-check]].** They were one
> page until 2026-08-20 and were split because they answer different questions: this one tests
> an enzyme, that one tests a DNA sample.

> **Hia5 is the methyltransferase (MTase)** — the enzyme that *writes* m6A, and the thing under
> test here. [[dpni|DpnI]], used downstream, is a restriction enzyme that only *reads* the mark.

> **Two functions, only one tested here.** The [Anchor Tag](../../projects/anchor-tag/index.md)
> fusions must (1) methylate and (2) bind their target through the fused reader domain. **This
> test measures only (1).** "Tudor-Hia5 is functional" from this gel means *the Hia5 half
> works*. It says nothing about whether the Tudor half finds H3K4me1 — see § Background.

## Materials

### Reaction components

| Component | Amount |
| --- | --- |
| HMW DNA | Volume giving 100 ng per reaction |
| Purified Hia5 / Hia5 fusion | Titrate — see § Dosing below |
| Activation buffer with [[s-adenosylmethionine]] | **20 µL** per reaction, SAM at **160 µM** |

Use **clean HMW DNA**, or ONT bacterial lambda DNA ([[lambda-dna-standard]]) as in the
original protocol (2 µL of 50 ng/µL = 100 ng). The 06.14.2026 run used 100 ng of HMW DNA per
reaction.

Use **fresh [[s-adenosylmethionine]]** — NEB B9003S, 32 mM. SAM is highly labile and degrades
with freeze/thaw. A dead SAM aliquot is the most common cause of a false negative here.

> **Critical — do not "reconcile" the two SAM concentrations.** This test uses **160 µM** SAM.
> The Fiber-seq labeling reaction uses **800 µM** (see [[fiber-seq-hia5-labeling]]). They
> differ on purpose, and the source doc calls the difference out explicitly rather than
> treating it as an error. Do not edit one to match the other.

### Activation buffer

Same activation buffer as the labeling reaction, with SAM added to 160 µM instead of 800 µM.
Make **200 µL** and add 1 µL of the 32 mM SAM stock. The 06.14.2026 run used the
**sucrose-containing** version of the activation buffer.

> ⚠️ **Spermidine is unresolved — read § Notes before you make this buffer.** The two source
> tables disagree by 10× (0.05 mM vs 0.5 mM final). Nobody has settled which was used.

## Dosing

There are two ways the lab has set the enzyme input, and they are not equivalent.

**By molarity (March 2026).** Titrate at **25 / 50 / 100 nM** in a 20 µL reaction. Complete
digestion at the 25 nM point indicates high activity.

**By total protein mass (June 2026).** The 06.14.2026 run gave each protein stock four input
levels — **300 / 150 / 75 / 30 ng** — against a fixed 100 ng of HMW DNA.

> **The two are not interchangeable, because the lab's nM figures are not purity-corrected.**
> The nM column on [[hia5-protein-stocks]] is computed from **total** protein concentration.
> For a stock at <30% purity, "50 nM" means 50 nM of protein in the tube, of which most is not
> Hia5. When you compare constructs, decide up front whether you are matching total mass or
> matching active enzyme, and write down which.

Useful cross-protocol reference points from the dev log:

- Fiber-seq working amount: **2 µL of Hia5 stock per 1 million nuclei**, in a 60 µL reaction
  for 10 min.
- DiMeLo-seq recommends **200 nM in 200 µL** for 1–5 million nuclei. The 50 nM point in this
  test is ¼ of that.

## Procedure

### 1. Set up the reactions

Prepare **200 µL of activation buffer**, adding SAM to a final concentration of **160 µM**
(1 µL of 32 mM stock).

For each protein and each input level, combine 100 ng HMW DNA with the enzyme in **20 µL** of
activation buffer. Include the controls you want from § Controls below.

Mix with a **wide-bore tip** throughout. The eventual readout is a size shift, so shearing the
input corrupts it.

### 2. Incubate

**37 °C for 1 h.**

Conditions here are deliberately harsher than a real labeling run — 37 °C for 1 h versus 25 °C
for 10 min in nuclei. The goal is to saturate the DNA and get an unambiguous gel, not to hit
the 5–7% m6A window Fiber-seq needs. **Do not carry these conditions into a labeling reaction.**

### 3. Stop the reaction

Add **6 µL of 10% SDS** and vortex to mix (06.14.2026 procedure). This denatures Hia5 so
it cannot keep working during the digestion step.

### 4. Read it out

Go to **[[dpni-methylation-check]]**. Each reaction is split into a +DpnI and a −DpnI aliquot;
the difference between them is the answer. Do not build a gel of +DpnI lanes only.

## Controls

At minimum:

- **No-enzyme reaction** — same DNA, same buffer, same SAM, no protein. Carried through
  digestion, this is what tells you the input DNA does not already carry m6A.
- **[[epicypher-cutana-hia5]]** — the lab's known-good commercial enzyme, run alongside. If
  Epicypher fails on the same day, the problem is the SAM, the buffer, or the DNA, not the
  construct under test.

Worth adding when comparing constructs:

- **A purity-matched or active-enzyme-matched dose**, not just an equal total-mass dose. See
  § Notes for why this matters.

## Safety

Standard BSL1. SDS is an irritant. Gel work per [[dpni-methylation-check]] and
[[gel-imaging-and-annotation]].

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Nothing methylated, including the Epicypher control | Dead SAM, or wrong buffer | SAM is highly labile and degrades with freeze/thaw — use a fresh aliquot before suspecting any enzyme. Confirm the activation buffer was made fresh |
| Epicypher worked, the construct did not | Genuinely low activity, or too little active enzyme delivered | Options recorded 03.30.2026: increase enzyme (0.034 → 0.05 µg per reaction, or more), increase incubation time, or both. If the stock is low-purity, match on active enzyme rather than total protein mass |
| Partial methylation only at the highest input | Low activity, or a stock concentration error | Repeat with a fresh dilution series; verify the concentration used in the nM calculation against [[hia5-protein-stocks]] |
| No-enzyme control also methylated | Hia5 carryover between tubes, or endogenous m6A in the source DNA | Fresh tips per tube. Check whether the source DNA could already be methylated — the dev log flags checking Arabidopsis HiFi data for endogenous 6mA as an open task |
| Every lane is smeared, including undigested | Shearing during handling | Wide-bore tips throughout; do not vortex except for the SDS stop |

## Background — why this works

**Hia5 is the methyltransferase** — a bacterial N6-adenine DNA methyltransferase (**MTase**)
with no sequence specificity beyond needing an accessible adenine. It is the enzyme that
*writes* m6A, using SAM as the methyl donor. Everywhere these pages say "the MTase," they mean
Hia5 or a Hia5 fusion; the only other enzyme in this workflow, [[dpni|DpnI]], is a restriction
enzyme that *reads* the mark on [[dpni-methylation-check]] and never methylates anything.

In a Fiber-seq experiment Hia5 works on chromatin inside intact nuclei
([[fiber-seq-hia5-labeling]]). Here it works on naked, protein-free HMW DNA, which removes
chromatin as a variable: **if the enzyme cannot methylate naked DNA, nothing downstream is
worth attempting.**

**Two functions, only one tested here.** The [Anchor Tag](../../projects/anchor-tag/index.md)
fusion constructs need to do two things: (1) methylate, and (2) bind their target through the
fused reader domain. **This test only measures (1).** A construct can pass here and still be
useless if the fused domain does not bind. Target binding needs a separate DiMeLo-seq-style
experiment, which the dev log proposes and which has never been run.

> This is the single most common misreading of the lab's Hia5 results. "Tudor-Hia5 is
> functional" from a gel like this means *the Hia5 half works*. It says nothing about whether
> the Tudor half finds H3K4me1.

**The 601 sequence.** The source protocol also uses a 147 bp artificial nucleosome-positioning
sequence ("601") wrapped into artificial chromatin. Because a nucleosome physically occludes
the DNA it wraps, the 601 region shows **protection from methylation** — the same footprinting
principle Fiber-seq depends on, in a defined single-nucleosome system. For the fusion
constructs it also raises the open question recorded in the dev log: if nucleosomes block
methylation, can a targeted Hia5 fusion still map histone modifications at the nucleosome it
is recruited to? The recorded plan was to compare m6A/A for free Hia5 versus antibody-directed
Hia5 in regions that are and are not nucleosome-protected.

## Notes, open questions and sources

**Page history.** Written 2026-08-18. Split out of the former combined "Hia5 DpnI Activity
Assay" page on 2026-08-20; the gel readout moved to [[dpni-methylation-check]]. Dosing and
round-2 evidence sharpened 2026-08-20 from the *AnchorTag/RUN_NEW* spreadsheet.

**Source.** Lab implementation in the *Fiber-Seq Experiments - Initial Tests* Google Doc
(*Fiber-Seq Experiments* tab, entries 03.06 / 03.16 / 03.25 / 03.30.2026) and the
*AnchorTag_NewUpdates_June2026* doc (06.14.2026 entry). Stock concentrations, purities and the
footnotes explaining how the sub-floor values were derived come from the Google Sheet
*AnchorTag/RUN_NEW*, tabs `Jan2026`, `June2026` and `AnchorTag` — read the **lab-owned copy**
in `Monroe Lab / Order/Inventory/Space / Protein Stocks`
([open](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit)),
snapshotted and verified against the original on 2026-08-20. Method adapted from the protocols.io
procedure for testing nanobody-Hia5 fusions (`g3iibykcf`).

### Open questions

- **Spermidine, 10× unresolved.** The activation buffer table printed alongside this assay
  lists spermidine at **0.05 mM final**, while the buffer table on the *Protocol* tab lists
  **0.5 mM final**. Both tables are internally self-consistent (their stock-to-volume
  arithmetic checks out at their own stated target), so this is a difference in the intended
  concentration, not a dilution-math slip. The same conflict is flagged on
  [[fiber-seq-hia5-labeling]].
  `[VERIFY: which spermidine concentration was actually used on the bench, and which is
  correct? This has never been resolved in the dev log.]`
- `[VERIFY: the March 2026 runs do not record an SDS stop. Confirm whether SDS was added then
  too, and whether the SDS carryover affects the DpnI digestion that follows.]`
- `[VERIFY: was the 601 / artificial chromatin arm ever actually run? Only the naked-HMW-DNA
  version appears in the results tables.]`
- `[VERIFY: resolve the full protocols.io URL and title for g3iibykcf before publishing.]`
- The dev log infers that if Fiber-seq behaves like ATAC-seq, DiMeLo-seq requires a **higher**
  Hia5 input than Fiber-seq does. `[VERIFY: this is reasoning in the dev log, not a measured
  result.]`

### What the lab has and has not established

This records the primary record, which is easy to read as saying more than it does. The
maintained construct-by-construct verdict table lives on [[fiber-seq-master-protocol]] — that
is the single place it is kept current.

#### Round 1 (Dec 2025 GenScript order), tested March 2026

- **03.30.2026, verbatim from the source doc:** *"ONLY Tudor-Hia5 reactions did not
  successfully methylate adenine."* Round-1 wild-type Tudor-Hia5 **failed**. The word "ONLY"
  implies free Hia5, pA-Hia5, 3ATudor-Hia5 and the Epicypher control all worked in that run,
  but the doc records **no individual verdict** for any of them, and no images were interpreted
  construct by construct.
- The 03.30.2026 gel tested five proteins in triplicate timepoints: E1–E3 Epicypher Hia5,
  A1–A3 free Hia5, B1–B3 pA-Hia5, C1–C3 Tudor-Hia5, D1–D3 3ATudor-Hia5 — all at 100 ng HMW
  DNA, DpnI-digested, at 5 min / 20 min / 1 h.
- **pAG-Hia5 has no written verdict anywhere.** It was not in the 03.30.2026 run at all. It
  appears only in an undated titration table and the 03.16.2026 timecourse — gels that were
  run and photographed but never given a conclusion in text.
- **A separate 03.30.2026 note, *"Samples are successfully methylated,"* is about a different
  experiment.** It refers to verification of the 03.25.2026 Fiber-seq samples (FS_1, FS_2,
  FS_6, FS_10, FS_10S), which were labeled with **Epicypher Hia5 in nuclei** and contain no
  Tudor construct. **Do not conflate these two sentences.** Conflating them is how the lab's
  notes previously ended up recording the Tudor result backwards.

#### Two things that complicate the 03.30 Tudor-Hia5 verdict

Neither overturns the result. Both mean it should be re-run before "Tudor-Hia5 does not
methylate" is treated as a settled property of the construct.

**1. The proteins were dosed by total mass, not by active enzyme — and the mass itself was
computed from an upper bound.** The 03.30 note records *"Added 0.034ng of each protein stock
per reaction"* and *"Used 11.72ul of the protein stock."* Equal total protein mass across
constructs whose stocks range from **<30% to 95% purity** already means the actual amount of
Hia5 delivered differed by more than 3× between tubes.

The `Jan2026` tab of *AnchorTag/RUN_NEW* makes it worse, in its own footnotes: *"For samples
with purity of NA, they indicate any purity that is less than 30% --> used 29% as estimate"*
and *"for samples with conc listed as 0.01mg/ml, they are actually <0.01; removed < for
calculations."* Round-1 Tudor-Hia5 is one of the two constructs those footnotes apply to. So
its working concentration of 0.0029 mg/mL is **0.01 × 0.29, a ceiling multiplied by a
ceiling** — the true value is lower than 0.0029 by an unknown factor. The 11.72 µL that was
pipetted therefore delivered **less** than the intended 0.034 µg, and less active enzyme
again on top of that.

**The molar comparison is the sharpest way to see it.** From the same tab, in the same units,
in the same run:

| Construct | Purity | Working conc (mg/mL) | nM stock |
| --- | --- | --- | --- |
| Tudor-Hia5 | N/A, i.e. **<30%** (estimated 29%) | 0.0029 **(upper bound)** | **65.33** |
| 3ATudor-Hia5 | ≥70% | 0.028 | **635.04** |

The construct that "failed" ran at roughly **one tenth the molarity of its own negative
control**, and its true figure is lower still. A ~10× enzyme deficit is more than enough to
produce a blank lane on a 5-minute-to-1-hour DpnI timecourse without the protein being dead.

> `[VERIFY: was the 03.30 dosing intended to be equal total mass, or equal active enzyme?
> Either way the Tudor-Hia5 failure is confounded with its concentration and purity, and the
> comparison should be repeated at matched active-enzyme input before the construct is written
> off. The round-1 tubes may no longer be worth this — the round-2 MBP fusions exist precisely
> because round-1 expression failed.]`

**2. The recorded unit is wrong — it must be 0.034 µg, not 0.034 ng.** The two numbers in the
note only agree at µg: 0.034 µg ÷ 0.0029 µg/µL (= 0.0029 mg/mL, the round-1 Tudor-Hia5 and
free Hia5 stock concentration) = **11.72 µL**, exactly the volume recorded. At 0.034 **ng** the
volume would be 0.0117 µL, a thousand-fold smaller and unpipettable. Read the entry as
**0.034 µg (34 ng) of total protein per reaction**, and read the follow-up option *"increase
0.034 → 0.05"* in the same units.

> `[VERIFY: confirm against Vianney's bench notebook, which the entry says holds the exact
> volumes used. The µg reading is arithmetic on the doc's own numbers, not a bench record.]`

#### Round 2 (June 2026 shipment) — suggestive, not scored

The round-2 constructs are MBP fusions that were **never cleaved**, so what is in the tube is
the intact ~84.5 kDa fusion, not the ~41.5 kDa Hia5 module. See [[hia5-protein-stocks]].

Setup for a round-2 activity test was documented **06.14.2026** — two June proteins
(Tudor-Hia5, 3ATudor-Hia5) plus two January proteins (pA-Hia5, pAG-Hia5), four input levels
each, against 100 ng HMW DNA. **The document ends there. No result was ever written down, and
no gel was scored.**

The only statement the lab has is [[vianney-ahn|Vianney]]'s, from a Slack DM on
**2026-08-06**, verbatim:

> *"As for the Hia5 activity test, I believe the gel in the photo were testing the older batch
> of pA-Hia5 that we received back in February/March, but I did test the Hia5 from the more
> recent shipment from June, and they seem to be functional."*

**Treat this as suggestive, not as a result.** Specifically:

- It **names no construct**. The June shipment held **four** proteins — Round2_A Tudor-Hia5,
  Round2_E 3ATudor-Hia5, Round2_C Tudor-MNase and Round2_F 3ATudor-MNase. "The Hia5 from the
  June shipment" narrows to A and E at best, and one of those two — **3ATudor-Hia5 — is the
  binding-pocket negative control.** Its methylation activity being intact is expected and
  carries no information about the wild-type construct.
- **The June 2026 bench record contains no Hia5 work at all.** The `AnchorTag` tab of
  *AnchorTag/RUN_NEW* logs ~50 experiments dated 06/08/2026–06/29/2026 and the enzyme column
  reads `Tudor-MNase` or `3ATudor-MNase` on every single row. The `June2026` inventory tab
  fills in vial counts and per-reaction dilutions for both MNase constructs and leaves both
  columns blank for both Hia5 constructs. June 2026 bench effort went into MNase; the round-2
  Hia5 proteins look received but never worked up.
- It is hedged — *"seem to be functional"* — and points at no gel, date, or lane.
- **No functional QC was ordered from GenScript for round 2.** The purchased QC was SDS-PAGE
  and Western blot only; the vault record states plainly that functional activity QC was to be
  done in-house. It was set up on 06.14 and not finished.
- Even at face value it speaks only to methylation, not to Tudor binding — see § Background.

> `[VERIFY: locate and score the June/July 2026 gels, or record explicitly that round 2 is
> unscored. Per Vianney (Slack, 2026-08-11), the round-2 tubes are dated — June/July dates are
> the newer batch. Until a gel is scored construct by construct, round-2 Tudor-Hia5 should be
> written as "not yet scored," not as "confirmed active."]`

> **Critical:** The only Hia5 the lab can currently claim as validated for production
> Fiber-seq is [[epicypher-cutana-hia5]]. Every
> [Anchor Tag](../../projects/anchor-tag/index.md) construct is a project-stage reagent.

## Resources and links

**Equipment:** [[thermocycler]]

**Reagents:** [[s-adenosylmethionine]], [[epicypher-cutana-hia5]], [[lambda-dna-standard]]

**Consumables:** [[pcr-strip-tubes-0-2ml]], [[wide-bore-filter-tips-p200]]

**Related Protocols:** [[dpni-methylation-check]], [[fiber-seq-hia5-labeling]], [[fiber-seq-master-protocol]]

**Contacts:** [[grey-monroe]]

**See also**

- [[dpni-methylation-check]] — the readout for this test
- [[hia5-protein-stocks]] — what is in the freezer, at what concentration and purity
- [[fiber-seq-hia5-labeling]] — the in-nuclei labeling reaction this test qualifies an enzyme for
- [[fiber-seq-master-protocol]] — the hub, and the maintained construct verdict table
- [Anchor Tag](../../projects/anchor-tag/index.md) — the Hia5 fusion construct project
- [[fiber-seq-development-log]]
