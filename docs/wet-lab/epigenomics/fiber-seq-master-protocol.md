---
type: protocol
title: "Fiber-seq Master Protocol"
---

# Fiber-seq Master Protocol

> **Draft — not yet bench-verified.** Written 2026-08-18 from the lab's Fiber-seq
> development record. Confirm every volume and concentration against your own run
> before relying on it. Unresolved values are marked `[VERIFY: ...]`.

## Resources

**Equipment:** [[celldrop]], [[centrifuge]], [[femtopulse]], [[nanodrop]], [[qubit-fluorometer]], [[thermocycler]]

**Kits:** [[qubit-dsdna-hs-assay-kit]]

**Reagents:** [[epicypher-cutana-hia5]], [[hia5-protein-stocks]], [[s-adenosylmethionine]], [[spermidine]], [[sucrose]]

**Consumables:** [[dna-lobind-tubes]], [[wide-bore-filter-tips-p1000]], [[wide-bore-filter-tips-p200]]

**Related Protocols:** [[fiber-seq-nuclei-isolation]], [[fiber-seq-hia5-labeling]], [[fiber-seq-hmw-extraction]], [[dpni-methylation-check]], [[hia5-enzyme-activity-test]], [[hmw-size-selection]], [[ot2-hmw-shearing]], [[pacbio-hifi-sequencing]], [[cut-and-tag]]

**Contacts:** [[grey-monroe]]

**Purpose:** Fiber-seq maps chromatin accessibility, transcription-factor occupancy, and
nucleosome positioning at single-molecule, near-nucleotide resolution. Intact nuclei are
treated with a non-sequence-specific m6A methyltransferase (Hia5), and the resulting
methylation pattern is read directly off PacBio HiFi reads. This page is the hub: read it
first, then work through the linked step pages in order.

**Source:** Lab development record — [[fiber-seq-development-log]] and the source Google
Doc *Fiber-Seq Experiments - Initial Tests* (2026), *Protocol* tab.
Published plant methods: [PNAS 2025 plant Fiber-seq](https://www.pnas.org/doi/10.1073/pnas.2516708122)
and the [Nature Plants maize TE paper, May 2025](https://www.nature.com/articles/s41477-025-02002-z).
Commercial reference: Epicypher CUTANA Fiber-seq product documentation.

> `[VERIFY: the two papers above are recorded in the lab doc by URL only. Resolve full
> author/title/DOI citations via /cite-add before any of this text is reused in a
> manuscript or grant. Handbook links are fine as-is.]`

## Background

### What Fiber-seq measures

A chromatin fiber is the three-dimensional organization of DNA wrapped around histones.
Bulk accessibility assays like DNase-seq and ATAC-seq average that organization across
millions of cells, so they tell you that a regulatory element is accessible *on average*
without telling you whether it was accessible on any individual molecule. Fiber-seq
resolves the primary architecture of chromatin along its underlying DNA template on
**individual multi-kilobase molecules**, which is what makes it possible to ask whether a
promoter and its enhancer were open on the *same* fiber.

### Why Hia5, a non-specific m6A MTase, reports accessibility

**Hia5 is the methyltransferase** in this workflow — a bacterial N6-adenine DNA
methyltransferase (MTase) with no sequence-context preference. It is the enzyme that writes the
m6A mark, and nothing else in the protocol methylates DNA. (The other enzyme you will meet,
[[dpni|DpnI]], is a restriction enzyme used only to *detect* that mark on a gel.)
Applied to intact nuclei, Hia5 methylates any adenine it can physically reach. DNA that is
wrapped in a nucleosome or occupied by a transcription factor is shielded, so **a protein
footprint appears as a localized gap in m6A along a single long read**. Two size classes of
methylase-accessible region are expected, and both were seen in the original work: elements
averaging ~272 bp that coincide with DNase-hypersensitive sites, and far more numerous ~67 bp
elements with regular spacing, matching internucleosomal linkers.

Because the enzyme is native to bacteria, which lack histones, it is worth knowing that its
behavior on non-chromatinized DNA is a live question rather than a settled one.

### Reading footprints and nucleosomes

The distance between adjacent m6A marks is the primary signal. Recurrent ~150 bp gaps
indicate nucleosome occupancy, and the oscillatory pattern in those spacings has been read
as nucleosome breathing. Well-positioned nucleosomes — those at the same location across
most cells in the population — show up as regular ripples in the m6A signal, and largely
originate from fibers where the regulatory element is in an actuated state.

"Regulatory DNA actuation" is the all-or-none adoption of a nucleosome-free state that
makes the underlying DNA hyperaccessible. Single-molecule data is what lets you see that
it is all-or-none rather than graded.

### Why PacBio HiFi specifically

m6A is not called from sequence. It is called from **polymerase kinetics**, and the calls
are carried in the BAM `MM`/`ML` tags. This has two consequences that determine whether an
experiment works at all: the sequencing run must be configured with **base kinetics
enabled**, and read length caps how much chromatin context you get per molecule, which is
why every upstream step is organized around keeping DNA long.

### The ~5–7% m6A window

Too little methylation and there is no signal. Too much and the footprints disappear into
background — with high global m6A you cannot resolve which regions were genuinely
inaccessible. PacBio targets a working range of **~5–7% 6mA** as the balance between
footprint resolution and over-labeling. Within putative regulatory elements, the fraction
of m6A per A/T rises with enzyme input, so higher but still moderate labeling improves
transcription-factor footprint resolution.

**The over-labeling check is inferred nucleosome length.** If the nucleosome lengths you
infer from the data are shorter than the real ~150 bp, you have over-labeled.

### How this relates to the lab's other assays

[[cut-and-tag]] and [[chip-seq]] ask where a *specific* protein is bound, genome-wide and
in aggregate. Fiber-seq asks what the *whole* accessibility landscape looked like on each
individual molecule. Fiber-seq and DiMeLo-seq share this nuclei-prep lineage and the same
Hia5 chemistry; DiMeLo-seq adds an antibody or protein-A fusion to target the methylation
to one factor. The lab's [Anchor Tag](../../projects/anchor-tag/index.md) constructs are the route to that targeted version.

> `[VERIFY: plants are assumed to have negligible endogenous 6mA background, which is what
> makes the m6A signal interpretable. Checking this against the lab's existing Arabidopsis
> HiFi data was flagged as a to-do in the development log and has never been done. Do it
> before publishing any FDR claim.]`

## Time estimate

Documented incubations only. Hands-on time has never been recorded.

| Stage | Documented elapsed |
| --- | --- |
| [[fiber-seq-nuclei-isolation]] | 20 min lysis on ice + 2 × 15 min spins, plus grinding, filtering and counting |
| [[fiber-seq-hia5-labeling]] | 5 min pellet spin + **10 min reaction** |
| [[fiber-seq-hmw-extraction]] | 20 min lysis at 55 °C + 10 min spin + 10 min CI mixing + 10 min spin + 30 min bead binding + washes |
| QC — [[dpni-methylation-check]] | 1 h digest + ~45 min gel (plus 1 h MTase step if you are also running [[hia5-enzyme-activity-test\|the in vitro enzyme test]]) |
| QC — FemtoPulse, Qubit, NanoDrop | — |
| Shearing → library → sequencing | Days to weeks, at the core |

Plan on nuclei isolation through extraction being a **full day**, with the DpnI gel on a
following day.

`[VERIFY: actual hands-on times. Nothing in the development log records them. Time a run,
or ask Vianney.]`

## Required input

Fresh or -80 °C frozen tissue. Species and tissue mass drive nuclei yield, which is the
gate on everything downstream. Two systems have been run so far:

| System | Status |
| --- | --- |
| Arabidopsis Col-0 seedlings | Run, both fresh and -80 °C frozen |
| Pistachio (PBTS) shoot culture — Z01, Z02, X03 | Run, 05.2026 |
| Walnut | Listed in the development log, never run |

## Procedure

This page is a decision map, not a bench procedure. Each numbered step links to the page
you actually run.

### 1. Isolate nuclei — [[fiber-seq-nuclei-isolation]]

Tissue in, counted nuclei out. Grind 500 mg–3 g in liquid nitrogen, lyse 20 min on ice in
nuclei isolation buffer, filter, and wash twice by centrifugation. **The count is the gate
for step 2**, and it is also the weakest measurement in the chain — see that page's note on
CellDrop under-counting.

### 2. Label with Hia5 — [[fiber-seq-hia5-labeling]]

The whole experiment. Resuspend counted nuclei in activation buffer with SAM, add Hia5,
**10 min at 25 °C**, stop with SDS to 1% final. Nuclei input and reaction volume are both
decided here.

### 3. Extract HMW DNA — [[fiber-seq-hmw-extraction]]

Straight from the SDS-stopped reaction, no freeze in between. **CTAB + chloroform-isoamyl +
SeraMag beads is the lab default** (Grey, 2026-08-18), established after the NEB spin-column
route failed on this input.

### 4. Confirm labeling worked — [[dpni-methylation-check]]

Take a small aliquot of the extracted DNA, digest with DpnI, run a gel. DpnI cuts GATC only
when the adenine is methylated, so digestion is a direct readout of whether Hia5 did
anything.

> **Critical:** This is the go/no-go gate before you spend money. A Revio run on unlabeled
> DNA produces a perfectly good genome and zero Fiber-seq data.

### 5. Size QC and shear decision — [[ot2-hmw-shearing]]

Run the extracted DNA on the [[femtopulse]] before deciding anything.

> **Decision point.** Per Noravit Chumchim (UC Davis DNA Technologies Core, 05.01.2026): if
> the pre-shear distribution is already narrow *and* its mode already sits in the range you
> want post-shear, **skip shearing** and go straight to library prep. As a general rule,
> samples where >50% of the DNA is longer than 30 kb with no prominent peak under 20 kb
> will land at roughly a 20 kb mode after pipette shearing.

### 6. Size selection — [[hmw-size-selection]]

> **Decision point.** The lab deliberately did **not** size select the first pooled
> Fiber-seq libraries, because round 1 was a labeling-conditions experiment and short
> fragments were kept on purpose to see whether they carry distinct accessibility signal.
> That is not a general recommendation. See that page for when the answer flips and for the
> LightBench and Pippin HT reference parameters.

### 7. Library prep and sequencing — [[pacbio-hifi-sequencing]]

Both plant papers used the SMRTbell prep kit 3.0. **The kit currently in the lab is the
HiFi plex prep kit 96.** Library input in the published work was 3.5 µg of DNA; in general
0.5–2 µg of gDNA is typical, but the real requirement comes from the sequencing platform's
own recommendations for native whole-genome applications.

> **Critical:** Sequencing must be run with **base kinetics enabled**. m6A is called from
> polymerase kinetics, not from sequence. Without kinetics there are no `MM`/`ML` tags, no
> m6A calls, and the entire experiment is wasted.

## Which Hia5 do I use?

**This table is the single source of truth for construct verdicts** (Grey, 2026-08-18).
Other pages link here rather than repeating it. Established by primary-source check of the
development record on 2026-08-18, round-2 status revised 2026-08-20. Concentrations, purities
and lot details for every construct live on [[hia5-protein-stocks]].

| Enzyme | Status | Use for production Fiber-seq? |
| --- | --- | --- |
| [[epicypher-cutana-hia5]] | Validated, commercial | **Yes — the only validated option** |
| free Hia5 (GenScript, round 1) | Project-stage, no individual verdict recorded | No |
| pA-Hia5 (round 1) | Project-stage, no individual verdict recorded | No |
| pAG-Hia5 (round 1) | Project-stage, **no written verdict anywhere** | No |
| Tudor-Hia5 (round 1) | **Failed** the 03.30.2026 DpnI assay | No |
| 3ATudor-Hia5 (round 1) | Project-stage; binding-pocket knockout, i.e. a negative control | No |
| Tudor-Hia5 (round 2, MBP-fused) | **Reported functional, never scored** — see below | Not yet |
| 3ATudor-Hia5 (round 2, MBP-fused) | Same reported-but-unscored status; negative control regardless | No |

What the record actually says, and what it does not:

- The one explicit verdict, verbatim from 03.30.2026, is *"ONLY Tudor-Hia5 reactions did not
  successfully methylate adenine."* Round-1 Tudor-Hia5 **failed**. The word "ONLY" implies
  free Hia5, pA-Hia5, 3ATudor-Hia5 and the Epicypher control worked, but **no individual
  verdict is recorded for any of them.**
- **pAG-Hia5 has no written verdict at all.** It appears only in undated and 03.16.2026
  titration gel images with no accompanying conclusion.
- A separate 03.30.2026 note, *"Samples are successfully methylated,"* refers to
  **Epicypher-Hia5-treated Fiber-seq nuclei** — a different experiment with no Tudor
  construct in it. **Do not conflate these two sentences.** Conflating them is how the lab's
  notes previously recorded the Tudor result backwards.
- **Round 2 (June 2026, MBP-fused) is reported functional but has never been scored.** The
  only statement is [[vianney-ahn|Vianney]]'s, verbatim from a Slack DM on 2026-08-06:
  *"I did test the Hia5 from the more recent shipment from June, and they seem to be
  functional."* Take it as suggestive, not as a result — it names no construct (the June
  shipment contained both the wild-type and the 3A negative control), points at no gel or
  date, and is hedged. The 06.14.2026 setup was documented and then the record stops with no
  outcome written down. No functional QC was ordered from GenScript for round 2 either; the
  purchased QC was SDS-PAGE and Western blot only. See [[hia5-enzyme-activity-test]] § Round 2.

> **Critical:** The only Hia5 the lab can currently claim as validated for production
> Fiber-seq is [[epicypher-cutana-hia5]]. The Tudor and pA/pAG constructs are project-stage
> reagents from [Anchor Tag](../../projects/anchor-tag/index.md) and must not be treated as interchangeable with it.

> **Even a scored gel would only establish half of it.** The DpnI readout measures methylation.
> Whether a fusion's reader domain actually binds its target has never been tested and needs a
> separate DiMeLo-seq-style experiment. "Tudor-Hia5 is functional" from a gel means the Hia5
> half works.

> `[VERIFY: score the June/July 2026 round-2 gels construct by construct, or record explicitly
> on [Anchor Tag](../../projects/anchor-tag/index.md) that round 2 is unscored and why. Per
> Vianney (Slack, 2026-08-11) the round-2 tubes are dated — June/July dates are the newer
> batch.]`

## Expected output

| Metric | Target |
| --- | --- |
| Genome-wide m6A | ~5–7% |
| Coverage | 30×, or 60× if haplotype-phased |
| Inferred nucleosome length | Consistent with ~150 bp — shorter means over-labeled |
| Data-quality check | Clear accessibility peaks at transcription start sites |

Note on read depth: increasing depth calls more accessible regions, but the additional calls
are progressively lower quality, representing infrequently occupied elements and more false
positives. More depth is not automatically better.

Analysis tooling lives at [fiberseq.github.io](https://fiberseq.github.io/) — 6mA is taken
from the PacBio `MM` tag, nucleosome occupancy via FiberHMM, and Fiber-seq Inferred
Regulatory Elements (FIREs) are the accessible-patch calls. **Analysis is out of scope for
this buildout (Grey, 2026-08-18) and will get its own page.**

## Troubleshooting

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| No m6A on the DpnI gel | Dead SAM, dead enzyme, or a project-stage construct | [[dpni-methylation-check]], then [[hia5-enzyme-activity-test]] |
| m6A too high, footprints washed out | Too much enzyme or too long an incubation | [[fiber-seq-hia5-labeling]] |
| Inferred nucleosomes shorter than ~150 bp | Over-labeling | [[fiber-seq-hia5-labeling]] |
| Low 260/230, DNA will not behave downstream | Guanidine carryover from column extraction | [[fiber-seq-hmw-extraction]] |
| Short fragments on the FemtoPulse trace | Mechanical shearing (tolerable) vs degradation (not) | [[fiber-seq-hmw-extraction]] |
| Nuclei count implausible against pellet size | CellDrop under-counting, unresolved | [[fiber-seq-nuclei-isolation]] |
| Sequencing returned no m6A calls at all | Base kinetics not enabled | Step 7 above |

## Safety

- **Liquid nitrogen** for grinding — cryo gloves, face shield, ventilated area.
- **β-mercaptoethanol** in the nuclei isolation buffer — fume hood.
- **Chloroform-isoamyl alcohol** in the CTAB extraction — fume hood only, halogenated
  organic waste.
- CTAB and SDS are irritants. Standard BSL1 otherwise.

Each step page carries its own safety section. Read the one for the step you are running.

## See also

- [[fiber-seq-development-log]] — the dated method-development record this page is built from
- [Anchor Tag](../../projects/anchor-tag/index.md) — the Hia5 fusion construct project
- [[cut-and-tag]], [[chip-seq]] — related epigenomics protocols
- [[pacbio-hifi-sequencing]], [[ot2-hmw-shearing]] — downstream library work
