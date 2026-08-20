---
type: protocol
title: "Hia5 m6A Labeling Reaction for Fiber-seq"
---

# Hia5 m6A Labeling Reaction for Fiber-seq

> **Draft — not yet bench-verified.** Confirm every volume and concentration against your own
> run before relying on it. Unresolved values are collected under § Notes, open questions and
> sources.

**What this does.** Treats intact nuclei with **Hia5, the m6A methyltransferase**, so that
accessible DNA is methylated and protein-bound DNA is left unmethylated. This ten-minute
reaction *is* the Fiber-seq signal. Everything before it is preparation and everything after
it is readout.

**When to run it.** Immediately after [[fiber-seq-nuclei-isolation]], with counted nuclei
pelleted and ready to resuspend. Go straight into [[fiber-seq-hmw-extraction]] afterwards —
do not freeze between the SDS stop and the extraction.

**Time:** 5 min pellet spin plus ~10 min setup, then a **10 min reaction**. Buffer can be made
ahead; **SAM is added at the activation step, not stored in the buffer.**
**Input:** counted nuclei from [[fiber-seq-nuclei-isolation]], aliquoted to the target number
and pelleted at 1,400 × g for 5 min. **Lab default 1 million; working range 1–6 million.**

> **Three things about this step drive everything.**
> **The reaction is short on purpose** — 10 min at 25 °C; longer pushes toward over-labeling,
> which erodes footprint resolution. **SAM is the labile reagent** — add it fresh at the
> activation step. **Wide-bore tips throughout** — you are handling nuclei that are about to
> yield the HMW DNA a Revio run depends on.

## Materials

### Activation Buffer

The lab's working table, from the *Protocol* tab:

| Component | Final | Stock | To make 50 mL | To make 10 mL |
| --- | --- | --- | --- | --- |
| Tris pH 8.0 | 15 mM | 1 M | 750 µL | 150 µL |
| NaCl | 15 mM | 5 M | 150 µL | 30 µL |
| KCl | 60 mM | 1 M | 3 mL | 600 µL |
| EDTA pH 8.0 | 1 mM | 0.5 M | 100 µL | 20 µL |
| EGTA pH 8.0 | 0.5 mM | 0.5 M | 50 µL | 10 µL |
| [[spermidine]] ⚠️ | 0.5 mM | 2 M | 12.5 µL | 2.5 µL |
| BSA | 0.1% | — | 50 mg | 10 mg |
| **SAM** | **800 µM** | 32 mM | **add at the activation step** | — |
| H₂O | — | — | fill to 50 mL | fill to 10 mL |

**Additional component for the modified activation buffer:**

| Component | Final | Stock | To make 50 mL | To make 10 mL |
| --- | --- | --- | --- | --- |
| [[sucrose]] ⚠️ | 400 mM | 1 M | 20 mL | 4 mL |

> ⚠️ **Two entries above are unresolved — read § Notes before you make this buffer.**
> Spermidine differs 10× between the two source tables (0.5 mM here vs 0.05 mM on the
> [[hia5-enzyme-activity-test]] buffer). Sucrose is listed as an optional "additional
> component" here, but both plant papers include it as standard.

### Consumables

- [[dna-lobind-tubes]], 1.5 mL
- [[wide-bore-filter-tips-p200]] and [[wide-bore-filter-tips-p1000]] — not optional
- PCR tubes if running the incubation in a [[thermocycler]]

## Procedure

The numbered steps below are the lab's 100 µL reaction. For other scales see § Variation.

### 1. Final wash (conditional)

**Only if the nuclei are still visibly dirty:** resuspend in 1 mL NIB storage buffer and spin
at 3,000 × g for 10 min.

### 2. Resuspend and count

Resuspend the nuclei in 1 mL NIB storage buffer. If the sample is oxidized or heavily
contaminated with cell debris, let it settle briefly and transfer only the nuclei-containing
supernatant to a new 1.5 mL tube. Count on the [[celldrop]] at **1:8 and 1:50 dilutions in H₂O**.

See the counting caveat on [[fiber-seq-nuclei-isolation]] — the CellDrop is suspected of
under-counting and this was never resolved.

### 3. Aliquot and pellet

Resuspend the nuclei again before aliquoting, then aliquot the target number into 1.5 mL
tubes. Centrifuge at **1,400 × g for 5 min** to pellet.

### 4. Resuspend in activation buffer with SAM

Resuspend the pellet in **97 µL activation buffer with 2.5 µL of 32 mM SAM** (800 µM final in
the 100 µL reaction).

> **Critical — SAM arithmetic. Use the lab's number, not the papers'.** Both plant papers
> state "1.5 µL of 32 mM SAM (final concentration 0.8 mM)" in a **100 µL** reaction. That
> arithmetic does not work: 1.5 µL of 32 mM in 100 µL is **0.48 mM**, not 0.8 mM. The 1.5 µL
> figure reaches 0.8 mM only in Epicypher's **60 µL** reaction, which is where it appears to
> have been carried over from. The lab's protocol uses **2.5 µL in 100 µL**, which does reach
> 0.8 mM.

> **Critical — SAM handling.** Per Epicypher: *"SAM is a highly labile reagent and prone to
> degradation with repeated freeze/thaw cycles. Always use fresh, high-grade SAM."* Add it at
> the activation step. Never store it in the buffer.

### 5. Add Hia5 and mix

Add **0.5 µL of Hia5** per reaction. Resuspend with a wide-bore tip, **20–25×**.

> **Critical:** Wide-bore tips only. Standard tips shear the HMW DNA you are about to spend a
> Revio run on.

Which Hia5 to use is settled on [[fiber-seq-master-protocol]] — short version,
[[epicypher-cutana-hia5]] is the only validated option and the [Anchor Tag](../../projects/anchor-tag/index.md) constructs are
project-stage reagents.

### 6. Incubate

**10 min at 25 °C.** Epicypher recommends a [[thermocycler]] for this incubation to get even
temperature and optimal labeling efficiency.

### 7. Stop

Add **10 µL of 10% SDS** per 100 µL reaction (1% final) and mix by wide-bore pipette.

Proceed directly to [[fiber-seq-hmw-extraction]]. Do not freeze between the stop and the
extraction.

## Variation

### Nuclei input

**Lab default: 1 million nuclei. Working range: 1–6 million.** (Grey, 2026-08-18.)

| Source | Nuclei | Reaction volume | Hia5 | Note |
| --- | --- | --- | --- | --- |
| **Lab default** | **1M** | **100 µL** | **0.5 µL** | What the CTAB tests used |
| PNAS 2025 / Nature Plants | 1–6M | 100 µL | 0.5 µL (100 U) | Both plant papers |
| Epicypher | 1M (human) | 60 µL | 2 µL | Commercial protocol |
| Genome-size scaling | 24.6M | 60 µL | 2 µL | **Rejected — impractical** |
| Tested 03.25.2026 | 1M / 2M / 6M / 10M | — | Constant | **Never scored by sequencing** |

Note the two published protocols disagree on enzyme by 4× at similar nuclei input — Epicypher
uses 2 µL per million nuclei, the plant papers use 0.5 µL for 1–6 million. The lab follows the
plant papers.

> **Critical — genome-size scaling was tested and rejected.** Epicypher's recommendation is to
> scale nuclei so the DNA content matches 1 million human nuclei, which for Arabidopsis
> (130 Mb, 4.06%) gives **24,615,000 nuclei** and requires 5–6 g of tissue. The lab tested this
> on 03.18.2026 and rejected it. The reasoning, from the development log: it is not safe to
> assume the number of accessible chromatin sites scales linearly with genome size, which is
> exactly what that recommendation assumes. Total DNA is not the substrate that matters here.

### Reaction volume

| Volume | Buffer | SAM (32 mM) | Hia5 | SDS stop | Source |
| --- | --- | --- | --- | --- | --- |
| 100 µL | 97 µL | 2.5 µL | 0.5 µL | 10 µL 10% | **Lab default** |
| 100 µL | 95.5 µL | 2.5 µL | 2 µL | 10 µL 10% | 06.18.2026 tests |
| 60 µL | 56.5 µL | 1.5 µL | 2 µL | 6.6 µL 10% | Epicypher / low input |
| 30 µL | 28.25 µL | 0.75 µL | 1 µL | 3 µL 10% | Half-scale, 03.18.2026 |

After the 30 µL half-scale reaction, add **67 µL of 1× reaction buffer** to bring the volume to
100 µL before proceeding to extraction. Epicypher does the equivalent for its 60 µL reaction,
adding 34 µL of 1× reaction buffer to reach 100 µL.

> **Note on the 60 µL stop volume.** The lab's table says **6.6 µL** of 10% SDS, which gives a
> true 1% final. Epicypher's own text says **6 µL**, which gives ~0.9%. The lab's number is the
> arithmetically correct one — the same kind of quiet correction as the SAM volume above.

### Incubation time

10 min at 25 °C is standard. Two timecourses were run and **neither outcome was ever scored in
writing** — see § Notes.

| Date | Timepoints | Enzyme |
| --- | --- | --- |
| 03.16.2026 | 5 / 10 / 30 / 60 / 90 min | — |
| 03.25.2026 | 2 / 5 / 20 / 60 min | Epicypher Hia5, 0.5 µL, on 50 ng of Fiber-seq DNA |

### Enzyme choice

The construct verdict table is on [[fiber-seq-master-protocol]] and is the single source of
truth. Do not restate verdicts here.

## Safety

SDS is an irritant — avoid generating dust when weighing the powder. Standard BSL1 otherwise.
The activation buffer itself carries no unusual hazards.

---

## Expected output

An SDS-stopped nuclei lysate ready for extraction. **There is no visible readout at this step.**
Confirmation that labeling worked comes from [[dpni-methylation-check]] after the DNA is
extracted — which is why that assay is the go/no-go gate before sequencing.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No m6A on the DpnI gel | Dead SAM (freeze/thaw), dead enzyme, or a project-stage construct | Use fresh SAM; run [[hia5-enzyme-activity-test]] on the enzyme lot itself against lambda DNA before blaming the sample |
| Over-labeling — inferred nucleosomes shorter than ~150 bp | Too much enzyme or too long an incubation | Return to 0.5 µL / 10 min; the 5–7% m6A window is the target, see [[fiber-seq-master-protocol]] |
| Nuclei not fully submerged in the reaction | Too many nuclei for the volume | Flagged at the 12.3M half-scale test, 03.18.2026 — reduce input or scale volume up |
| Signal weak but present | Under-labeling | Options recorded 03.30.2026: raise enzyme, extend incubation, or both |

## Background — why this works

**Hia5 is the methyltransferase** — a bacterial non-sequence-specific N6-adenine
methyltransferase (MTase). It methylates any adenine it can physically reach, so the readout is
**accessibility, not a sequence motif**. SAM is the methyl donor and is the labile reagent in
the system. Nothing else in this protocol methylates DNA; [[dpni|DpnI]], met downstream, only
detects the mark.

The reaction follows **Michaelis-Menten kinetics**, scaling with substrate. That is the logic
behind Epicypher's genome-size scaling recommendation, which the lab tested and rejected for
plants (see § Variation).

Ten minutes at 25 °C is short on purpose. Longer incubation pushes toward over-labeling, which
erodes footprint resolution — the check for it is inferred nucleosome length shorter than the
real ~150 bp.

Fuller background on what the reaction measures is on [[fiber-seq-master-protocol]].

## Notes, open questions and sources

**Page history.** Written 2026-08-18 from the lab's Fiber-seq development record.

**Source.** Lab protocol from the *Fiber-Seq Experiments - Initial Tests* Google Doc,
*Protocol* tab; [PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2516708122); the
[Nature Plants maize TE paper](https://www.nature.com/articles/s41477-025-02002-z);
Epicypher CUTANA Fiber-seq product documentation.

### Open questions

- **Spermidine, 10× unresolved.** The source document contains **two** activation buffer tables
  that disagree on spermidine by 10×. The *Protocol* tab gives **0.5 mM**, matching both plant
  papers. The earlier *Fiber-Seq Experiments* tab, whose buffer is used for the
  [[hia5-enzyme-activity-test]], gives **0.05 mM**. Both tables compute correctly for their own
  stated final concentration, so this is a genuine difference in the target, not a
  dilution-math slip. Do not silently reconcile them.
  `[VERIFY: which concentration was actually used in the 05.2026 and 06.2026 runs?]`
- **Sucrose, in or out.** Both plant papers include **400 mM sucrose** in the working buffer,
  and the development log notes that both papers use sucrose in the activation buffer. The
  lab's base table has none; sucrose appears only as an explicit "additional component for
  modified activation buffer."
  `[VERIFY: is sucrose in or out for the lab's current default? The papers say in.]`
- `[VERIFY: confirm with Vianney that the 2.5 µL SAM volume was a deliberate correction of the
  papers' arithmetic rather than a coincidence — it matters for how much else in the papers
  should be trusted.]`
- `[VERIFY: what was the 06.18.2026 test asking, and was it scored?]` It keeps the lab's 100 µL
  scale but raises enzyme to 2 µL, i.e. Epicypher's enzyme amount at the plant papers' volume.
- `[VERIFY: are the gels from the 03.16 and 03.25.2026 timecourses interpretable? If so, score
  them — this is the data that would justify or change the 10 min default.]`

### What the lab has and has not established

The 03.25.2026 nuclei-input series (1M / 2M / 6M / 10M) was run but **never scored by
sequencing**, so the 1M default rests on the plant papers and on Grey's 2026-08-18 call, not on
a lab result. Construct-by-construct Hia5 verdicts are maintained on
[[fiber-seq-master-protocol]] and are not restated here.

## Resources and links

**Equipment:** [[thermocycler]], [[centrifuge]]

**Reagents:** [[epicypher-cutana-hia5]], [[s-adenosylmethionine]], [[sucrose]], [[tris-base]], [[sodium-chloride]], [[potassium-chloride]], [[edta-trisodium-salt|EDTA]], [[egta]], [[spermidine]], [[bovine-serum-albumin-50mg-ml]], [[sodium-dodecyl-sulfate]]

**Consumables:** [[wide-bore-filter-tips-p200]], [[wide-bore-filter-tips-p1000]], [[dna-lobind-tubes]]

**Related Protocols:** [[fiber-seq-master-protocol]], [[fiber-seq-nuclei-isolation]], [[fiber-seq-hmw-extraction]], [[dpni-methylation-check]], [[hia5-enzyme-activity-test]]

**Contacts:** [[grey-monroe]]

**See also**

- [[fiber-seq-master-protocol]] — the hub, the Hia5 verdict table, and the Fiber-seq background
- [[fiber-seq-nuclei-isolation]] — the previous step
- [[fiber-seq-hmw-extraction]] — the next step
- [[dpni-methylation-check]] — how you find out whether this worked
- [[hia5-enzyme-activity-test]] — whether the enzyme lot was any good in the first place
- [[fiber-seq-development-log]]
