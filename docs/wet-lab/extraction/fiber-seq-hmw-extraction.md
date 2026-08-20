---
type: protocol
title: "Post-labeling HMW DNA Extraction for Fiber-seq"
---

# Post-labeling HMW DNA Extraction for Fiber-seq

> **Draft — not yet bench-verified.** Written 2026-08-18 from the lab's Fiber-seq
> development record. Confirm every volume and concentration against your own run
> before relying on it. Unresolved values are marked `[VERIFY: ...]`.

## Resources

**Equipment:** [[centrifuge]], [[hula-mixer]], [[femtopulse]], [[nanodrop]], [[qubit-fluorometer]], [[magnetic-rack]]

**Kits:** [[qubit-dsdna-hs-assay-kit]]

**Reagents:** [[cetrimonium-bromide|CTAB]], [[polyvinylpyrrolidone|PVP-40]], [[tris-base]], [[edta-trisodium-salt|EDTA]], [[sodium-chloride]], [[chloroform-isoamyl-alcohol-24-1]], [[cytiva-sera-mag-speedbead-carboxyl]], [[colibri-dna-library-cleanup-kit|Colibri beads]], [[ethanol-70]], [[sigma-proteinase-k]], [[rnase]]

**Consumables:** [[dna-lobind-tubes]], [[wide-bore-filter-tips-p1000]]

**Related Protocols:** [[fiber-seq-hia5-labeling]], [[fiber-seq-master-protocol]], [[hifi-dna-extraction]], [[sorbitol-ctab-hifi-extraction]], [[spri-beads-preparation]], [[ot2-hmw-shearing]]

**Contacts:** [[grey-monroe]]

**Purpose:** Recover high-molecular-weight DNA from SDS-stopped, Hia5-labeled nuclei with
the fragment length and purity a PacBio HiFi run needs. This is a different problem from
ordinary plant HMW extraction: the input is a nuclei lysate that already contains 1% SDS,
and the DNA has to stay long.

**Source:** Vianney Ahn's CTAB + chloroform-isoamyl protocol from the *Fiber-Seq Experiments -
Initial Tests* Google Doc, *Protocol* tab, written from experience because
[PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2516708122) specifies a CTAB extraction but
publishes no protocol — only a reagent list. CTAB buffer composition adapted from *A high
quality, high molecular weight DNA extraction method for PacBio HiFi genome sequencing of
recalcitrant plants* `[VERIFY: resolve full citation and DOI before publishing — the source
doc gives the title only]`. Method-choice evidence from the 03.18 / 03.23 / 03.25 / 05.01 /
05.18.2026 entries in the *Fiber-Seq Experiments* tab.

## Background

**Why length is the whole game.** A PacBio HiFi read cannot be longer than the molecule it
was made from. Fiber-seq's entire value proposition is reading the methylation footprint
pattern along one long, continuous chromatin fiber, so every kilobase you lose to shearing or
degradation is chromatin architecture you never get to see. An extraction that would be
perfectly good for short-read sequencing is a failure here.

**Why plants are hard.** Plant tissue carries polysaccharides, polyphenols, and starch that
co-purify with DNA and inhibit downstream enzymes. CTAB (a cationic detergent) is the classic
answer: at high salt it complexes with polysaccharides and keeps them in solution while DNA
partitions away, and PVP/PVPP mops up polyphenols by hydrogen bonding before they can oxidize
and bind the DNA. This is why the plant HMW literature is full of CTAB and the human Fiber-seq
protocols are not.

**Why this input is unusual.** You are not starting from tissue. You are starting from a
labeling reaction that has already been stopped with SDS and still contains nuclei, nuclear
debris, and the Hia5 protein. So the extraction has to do double duty: finish lysing the
nuclei and strip protein, without ever putting the DNA through a step that shortens it.

**Shearing versus degradation — the distinction that drives the method choice.** Per
Noravit Chumchim at the [[uc-davis-dna-technologies-core]], if you see short fragments on a
FemtoPulse trace you have damage, and the only question that matters is which kind:

- **Mechanical shearing** — from pipetting, column and bead cleanups, or aggressive tissue
  grinding. *"Generally, this should be fine and won't severely impact the quality of the
  library and sequencing."* Survivable.
- **Chemical degradation** — from poor tissue preservation or long exposure to harsh
  chemicals. Causes internal nicks that *"DNA repair steps during library prep might not be
  able to fix... perfectly,"* producing short polymerase reads and *"subpar or worse"*
  sequencing. Not survivable.

A trace alone cannot tell you which one you are looking at. That asymmetry is the reason the
lab moved off the column route rather than trying to tune it: a method whose damage mode is
unknown is not worth optimizing.

## Time estimate

20 min lysis at 55 °C, 10 min clearing spin, ~10 min chloroform mixing plus a 10 min phase
spin, 30 min bead binding, then washes and elution, plus the secondary cleanup. Roughly half
a day, most of it incubation.

`[VERIFY: hands-on time is not recorded anywhere in the development log.]`

## Required input

The SDS-stopped labeling reaction straight from [[fiber-seq-hia5-labeling]] — typically
110 µL (100 µL reaction + 10 µL of 10% SDS). One million nuclei per treatment is the
documented input.

Do not freeze before extracting. The only freezing recorded in the dev log is the
03.18.2026 samples, which were held at -20 °C **after** extraction.

## Choosing an extraction method

**Lab default: CTAB + chloroform-isoamyl + SeraMag beads.** (Grey, 2026-08-18.)

| Method | Status | Why |
| --- | --- | --- |
| **CTAB + CI + SeraMag** | **Lab default** | Consistent HMW yield (05.18.2026); the route Noravit recommended after seeing the traces |
| [[monarch-spin-gdna-extraction-kit]] (NEB T3010) | Tried, abandoned | Nuclei pellet clogs the column filter; guanidine carryover gives poor 260/230 |
| [[promega-wizard-hmw-dna-extraction-kit]] (A2920) | Never tried in-lab | What both published plant Fiber-seq papers use |

The evidence for the default is the **05.01.2026 FemtoPulse comparison**. Three samples
(FS_1, FS_6, FS_10S) were extracted on NEB spin columns and one (FS_T3_3) by CTAB on isolated
nuclei. Noravit's read of the four traces: the three column samples shared a method and shared
the problem, and *"the damage here is likely caused by the extraction method."* His
recommendation was explicit — *"I would highly suggest using DNA from the same extraction
method as sample 4 to guarantee better sequencing results."* Sample 4 was the CTAB extraction.
The 05.18.2026 entry then confirmed it in practice: *"New CTAB extraction yields consistent
HMW DNA."*

> **Critical — why the NEB columns were abandoned.** Two independent failures, both recorded:
> **(1) Flow.** 03.25.2026 — the nuclei pellet blocks the column filter, so supernatant that
> still contains DNA never binds and simply flows through, *"even at max speed and increased
> duration."* **(2) Purity.** 03.18.2026 — concentration and 260/280 were fine but the
> **260/230 was very low**, from guanidine salt carryover off the column. Two workarounds were
> logged (a third ethanol wash; or pellet the debris after lysis and load only the
> supernatant) and a SPRI cleanup did rescue the contaminated sample, but CTAB is where the
> lab landed. Do not restart on columns without reading the 05.01 trace comparison first.

The A2920 Promega kit is worth flagging because **both** published plant Fiber-seq papers use
it and the lab never tried it. `[VERIFY: is the Promega A2920 route worth testing as a
benchmark against in-house CTAB? It is the only method with published Fiber-seq results
behind it.]`

## Required materials

### Nuclei CTAB Lysis Buffer

| Component | Final | Stock | To make 10 mL |
| --- | --- | --- | --- |
| [[edta-trisodium-salt\|EDTA]] pH 8.0 | 20 mM | 0.5 M | 400 µL |
| Tris-HCl pH 8.0 | 100 mM | 1 M | 1 mL |
| [[sodium-chloride]] | 1.4 M | 5 M | 2.8 mL |
| [[cetrimonium-bromide\|CTAB]] | 2% | solid | 0.2 g |
| [[polyvinylpyrrolidone\|PVP-40]] | 1% | solid | 0.1 g |

Make up to volume with DI water and autoclave. CTAB and PVP-40 go in as solids, so the
percentages are w/v.

Add **1% PVPP (v/v) fresh, right before use** — this is separate from the PVP-40 in the
buffer above.

> `[VERIFY: PVP-40 and PVPP are different reagents — soluble polyvinylpyrrolidone versus
> insoluble cross-linked polyvinylpolypyrrolidone. The lab's buffer table lists PVP-40 at 1%
> as a buffer component, while the reference paper's text (and the CTAB & CI protocol step)
> calls for 1% PVPP added right before use. Both appear. Confirm whether the lab uses one,
> the other, or genuinely both.]`

### Other reagents

- Room-temperature [[chloroform-isoamyl-alcohol-24-1]] (24:1)
- 0.4% [[cytiva-sera-mag-speedbead-carboxyl]] (SeraMag) — see [[spri-beads-preparation]]
- [[colibri-dna-library-cleanup-kit|Colibri beads]] for the conditional third cleanup
- 80% ethanol, made fresh
- Pre-warmed elution buffer
- RNase A, Proteinase K

### Consumables

- [[dna-lobind-tubes]], 1.5 mL
- [[wide-bore-filter-tips-p1000]] — use these for every transfer of DNA-containing liquid

## Procedure

> **Handle everything gently.** Wide-bore tips, slow pipetting, inversion rather than
> vortexing. Every ordinary handling shortcut in this protocol costs read length.

### 1. Lysis

To the SDS-stopped reaction add **500 µL CTAB lysis buffer with 1% PVPP**, **12 µL RNase A**,
and **3.5 µL Proteinase** `[VERIFY: Proteinase K concentration and units — the source doc
truncates this line mid-phrase]`. Mix gently by pipette. Incubate **55 °C for 20 min**.

### 2. Clear the debris

Centrifuge **4,400 × g for 10 min**. Transfer the supernatant to a new tube, **noting the
volume transferred**. If less than 400 µL came across, top up to 400 µL with nuclease-free
water — the chloroform step in the next section adds an equal volume, so the volume has to be
known.

### 3. Chloroform extraction

Add an **equal volume of room-temperature chloroform-isoamyl alcohol (24:1)**. Invert
**20 times**, then **10 min at room temperature on the [[hula-mixer]] at 20 rpm**.

### 4. Phase separation

Centrifuge **5,000 × g for 10 min at room temperature**. **In the fume hood,** transfer the
**upper aqueous phase** to a fresh 1.5 mL tube. Leave the interface behind — chasing the last
few microliters pulls protein across.

### 5. Bead binding

Add an **equal volume of 0.4% SeraMag beads**. Mix by inverting **20–25 times** and incubate
**30 min at room temperature on the hula mixer at 10 rpm**.

### 6. Wash and elute

Spin the tubes down and place on the [[magnetic-rack]]. Wait until the solution is clear, then
remove the supernatant. **Two washes with 80% ethanol.** Elute in **30–50 µL of pre-warmed
EB**.

### 7. Secondary cleanup

Clean with **0.4% SeraMag beads at 1.05× volume**.

> **Critical — do not skip this.** The 05.18.2026 entry is unambiguous: *"Definitely include
> the secondary... beads cleanup."* It is what made the CTAB route give consistent HMW DNA
> across the Z01 / Z02 / X03 samples.

### 8. Conditional third cleanup

Run the eluate on the [[femtopulse]]. **If the trace shows a minor peak below 8 kb,** do a
further round with **0.2× Collibri beads** to pull the short fragments out.

> `[VERIFY: bead conflict. The Protocol tab says the secondary cleanup is 0.4% SeraMag at
> 1.05× volume, with 0.2X Collibri only as a conditional third round. The 05.18.2026 entry
> instead calls the secondary cleanup "0.4X Collibri beads." Note also that "0.4%" is a bead
> concentration and "0.4X"/"0.2X" are volume ratios, so these are not the same quantity even
> though the number matches. Confirm which bead and which ratio was actually run on the
> 05.2026 samples.]`

## Expected output

- **Purity:** 260/280 ≈ 1.8–1.9 and 260/230 > 2.0. The 03.23.2026 SPRI cleanup achieved
  **260/280 = 1.868, 260/230 = 2.362** at **80% recovery** (25 µL of 20.6 ng/µL in, ≈500 ng;
  50 µL of 8.00 ng/µL out, 400 ng).
- **Length:** on the FemtoPulse, **more than 50% of the DNA above 30 kb with no prominent
  peak below 20 kb.** Per Noravit, samples meeting that bar *"are likely to have ~20 kb mode
  size after pipette shearing"* — which is the input the library prep wants.
- **Yield:** `[VERIFY: no per-run yield from the CTAB route is recorded numerically anywhere
  in the dev log. Record it on the next run.]`

Take the trace to [[ot2-hmw-shearing]] before deciding to shear. If the pre-shear distribution
is already narrow with the mode in the target range, Noravit's advice is to **skip shearing**
and go straight into library prep.

## Verify labeling before you spend money

Take a small aliquot of the extracted DNA and run [[dpni-methylation-check]] to confirm m6A
is present. **This is the go/no-go gate before library prep.** It is what the 03.30.2026
verification of the 03.25.2026 samples did, and it costs one gel against the price of a
sequencing run on unlabeled DNA.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Low 260/230 | Guanidine carryover (column routes), or CTAB/polysaccharide carryover | SPRI cleanup rescued this on 03.23.2026 at 80% recovery. On columns, an extra ethanol wash was the logged workaround; better, use CTAB |
| Column will not flow | Nuclei pellet clogging the filter | Pellet the debris after lysis and load only the supernatant, or switch to CTAB (what the lab did) |
| Short fragments on FemtoPulse | Mechanical shearing **or** chemical degradation | Work out which. Shearing (pipetting, beads, columns, over-grinding) is tolerable; degradation from poor tissue preservation or prolonged harsh-chemical exposure is not and will give short polymerase reads. If the extraction method is the only variable between samples, suspect the method |
| Minor peak below 8 kb | Incomplete size cleanup | Additional round with 0.2× Collibri beads |
| Protein or interface carryover after CI | Aqueous phase taken too greedily | Leave more margin above the interface; re-extract with CI if needed |
| Wide size distribution across samples | Inconsistent extraction between samples | Match distributions before pooling — see [[pacbio-hifi-sequencing]] |

## Safety

- **Chloroform-isoamyl alcohol is fume-hood only.** Both the mixing and the post-spin phase
  transfer happen in the hood. Chloroform is a **halogenated** solvent — keep it separate from
  the non-halogenated (ethanol, methanol, isopropanol) waste stream. See
  [[waste-disposal-quick-reference]]; the lab's active container for this stream is
  [[bme-chloroform-phenol-waste]].
- **CTAB** is a skin, eye, and respiratory irritant — weigh it out carefully and avoid
  raising dust.
- **β-mercaptoethanol** is not used in this protocol, but is in the upstream nuclei isolation.
- Standard BSL1 otherwise.

## See also

- [[fiber-seq-master-protocol]] — the hub
- [[fiber-seq-hia5-labeling]] — the step immediately before this one
- [[dpni-methylation-check]] — the go/no-go check on the extracted DNA
- [[ot2-hmw-shearing]] — the shear-or-skip decision that follows
- [[hifi-dna-extraction]], [[sorbitol-ctab-hifi-extraction]] — the lab's non-Fiber-seq HMW routes
- [[spri-beads-preparation]]
- [[fiber-seq-development-log]]
