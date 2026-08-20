---
type: "protocol"
title: "(2) Plant Nuclei Isolation for Fiber-seq"
---

# (2) Plant Nuclei Isolation for Fiber-seq
> **Draft — not yet bench-verified.** Confirm every volume and concentration against your own
> run before relying on it. Unresolved values are collected under § Notes, open questions and
> sources.

**What this does.** Turns ground plant tissue into clean, intact, counted nuclei — the input to
the Hia5 labeling reaction. Nuclei quality drives everything downstream: debris carryover clogs
extraction columns and depresses DNA purity, and an inaccurate count means the labeling reaction
is dosed wrong.

**When to run it.**

- Immediately before [[fiber-seq-hia5-labeling]]. Nuclei go straight into the activation buffer;
  this is not a step you park overnight.
- Any time you need nuclei rather than naked DNA — [[cut-and-tag]] uses a sibling of this method.

**Time:** roughly half a day. Grind → 20 min lysis on ice → filter → 2 × 15 min spins at 4 °C →
count.
**Input:** 500 mg to 3 g of tissue, fresh or frozen at -80 °C.

> **Intact nuclei, not naked DNA.** The entire Fiber-seq signal depends on chromatin proteins
> still being bound so they can protect their footprints from [[epicypher-cutana-hia5|Hia5]], the
> m6A methyltransferase. Every step here exists to keep nuclei whole and their proteins on.

> **More tissue is not better.** The 03.25.2026 side-by-side found visibly more green material,
> debris, and intact cells in the 1 g isolate than in the 500 mg isolate. That debris carryover is
> what clogged the NEB spin columns downstream (see [[fiber-seq-hmw-extraction]]). If you scale
> tissue up, expect to pay for it in cleanup.

## Materials

### Equipment

- [[automill]] — larger compartment, for cryogenic grinding
- [[centrifuge]] — must reach 3,000 × g with 4 °C cooling
- [[celldrop]] — nuclei counting

### Consumables

- 50 mL Falcon tubes
- 70 µm cell strainer and 30–40 µm cell strainer, **or** a single 30 µm MACS SmartStrainer
  (Miltenyi Biotec Cat. #130-098-458) — see the variation at step 3
- [[wide-bore-filter-tips-p1000]]
- Liquid nitrogen

### Nuclei Isolation Buffer (NIB)

| Component | Final | Stock | To make 10 mL | To make 25 mL |
| --- | --- | --- | --- | --- |
| [[sucrose]] | 0.25 M | 1 M | 2.5 mL | 6.25 mL |
| Tris-HCl pH 8.0 | 10 mM | 1 M | 100 µL | 250 µL |
| MgCl₂ | 10 mM | 1 M | 100 µL | 250 µL |
| [[triton-x-100]] | 1% | 20% | 500 µL | 1.25 mL |
| β-mercaptoethanol | 5 mM | 14.3 M | 3.5 µL | 8.74 µL |
| [[roche-protease-inhibitor-cocktail-edta-free]] | 1× | — | ⅕ tab (4 tabs in 1.5 mL = 75 µL) | ½ tab (4 tabs in 1.5 mL = 187.5 µL) |

Make up to volume with water. Add β-mercaptoethanol in the fume hood.

## Procedure

### 1. Grind

Grind 500 mg–3 g of tissue to a fine powder in liquid nitrogen using the **larger [[automill]]
compartment**. Transfer the ground tissue into a 50 mL Falcon tube.

Keep everything cold. Do not let the powder thaw before buffer goes in.

### 2. Lyse

Add nuclei isolation buffer at **5 mL per 500 mg of tissue** and incubate **20 min on ice**.

### 3. Filter

Filter the lysate through a 70 µm cell strainer, then through a 30–40 µm strainer.

> **Variation.** The lab protocol uses the two-step 70 µm → 30–40 µm filtration above.
> PNAS 2025 uses a **single 30 µm MACS SmartStrainer** (Miltenyi Biotec Cat. #130-098-458).
> Both routes are documented; the lab has not recorded a comparison, and which route the recent
> runs actually used is unresolved — see § Notes.

### 4. Pellet and wash

Centrifuge at **3,000 × g for 15 min at 4 °C** to pellet the nuclei. Remove the supernatant,
gently resuspend the pellet in **5 mL** of nuclei isolation buffer, and centrifuge again under
the same conditions. Discard the supernatant.

### 5. Resuspend and count

Resuspend the nuclei in the working buffer for the next protocol — for Fiber-seq that is the
activation buffer in [[fiber-seq-hia5-labeling]]. Count on the [[celldrop]] at **1:8 and 1:50
dilutions in H₂O**.

> **Critical — nuclei counting is a known unresolved weak point.** The 03.18.2026 entry records
> that the resuspended pellet volume was far larger than the count predicted, with *"many doubts
> that the CellDrop is under-counting the nuclei"* and the note **"NEED TO OPTIMIZE NUCLEI
> COUNTING."** This was never resolved, and the lab's own replicate counts show the count moving
> with the dilution you happen to pick — **3× to 6× across a 1:4 to 1:100 series, replicated on
> three separate samples.** Treat any CellDrop count as a lower bound, sanity-check it against
> pellet size, and
> read § Nuclei counting — what the replicate data shows before you dose anything off it.

## Variation

### Tissue mass and yield

| Tissue mass | Nuclei yield | Note |
| --- | --- | --- |
| ~100 mg | 300,000–600,000 | In-house (CUT&Tag-lineage) protocol, Arabidopsis |
| 350–400 mg | Not recorded numerically | "Nuclei Extraction 1", 03.18.2026 — photographed, not counted |
| 700–800 mg | Not recorded numerically | "Nuclei Extraction 2", 03.18.2026 — photographed, not counted |
| 500 mg | Not recorded numerically | PNAS standard; visibly the cleaner isolate on 03.25.2026 |
| 1 g | Not recorded numerically | Visibly more green material and debris than 500 mg |
| 2.5 g | Enough for the 6M and 10M input tests, resuspended in 400 µL | 03.25.2026 |

Extrapolating from the ~100 mg figure, 500 mg should land in the low millions — consistent
with the 1–6 million working range. That is an extrapolation, not a measurement.

The 03.18.2026 run also compared the scaled-up protocol against the **default [[cut-and-tag]]
nuclei isolation protocol** side by side (isolates A1/A2 vs B1/B2). The isolates were then
pooled, so no separate verdict on the two protocols exists.

### Nuclei input per labeling reaction

**Lab default: 1 million nuclei. Working range: 1–6 million.** (Grey, 2026-08-18.)

The full input table with reaction volumes lives on [[fiber-seq-hia5-labeling]]. Both plant
papers use 1–6 million nuclei in a 100 µL reaction.

> **Critical — the genome-size scaling recommendation was tested and rejected.** Epicypher's
> protocol scales input to match the DNA content of 1 million human nuclei, on the Michaelis-Menten
> logic that the reaction scales with substrate. For Arabidopsis (130 Mb) that arithmetic gives
> **24,615,000 nuclei**, which needs 5–6 g of tissue. The lab tested it on 03.18.2026 and rejected
> it. The recorded reasoning: *"It is not straightforward to assume that # of accessible chromatin
> sites scales linearly with genome size, as the Epicypher protocol seems to imply."* The substrate
> that matters for footprint resolution is accessible chromatin, not total DNA.

### Species

| Species | Status | Note |
| --- | --- | --- |
| Arabidopsis Col-0 | Run | Seedlings, both fresh and from -80 °C |
| Pistachio (PBTS) | Run | Shoot culture, samples Z01 / Z02 / X03, 05.2026 |
| Walnut | Not run | Row exists in the development log, never filled in |

### Starting material — nuclei vs protoplasts

> Both plant papers describe **protoplasts** (1–5 million, spun at 2,000 × g) rather than
> nuclei from ground tissue as the input to the labeling reaction. The lab uses ground-tissue
> nuclei throughout. This is a real methodological divergence from the published protocol, not
> a detail. Whether to test the protoplast route is an open question — see § Notes.

## Safety

- **Liquid nitrogen** — cryo gloves, face shield, ventilated area. Never seal a container of it.
- **β-mercaptoethanol** — add in the fume hood; strong odor and a respiratory irritant.
- Standard BSL1 otherwise.

---

## Expected output

A pale, clean nuclei pellet with minimal green material, resuspended in the working buffer,
with a CellDrop count in the 1–6 million range for the intended reaction. Visible green or
brown color means chloroplast and debris carryover, which will cost you DNA purity downstream.

## Nuclei counting — what the replicate data shows

The `NUCLEI` tab of the *AnchorTag/RUN_NEW* spreadsheet is the only quantitative record the lab
has on this. It logs the CellDrop reading, the dilution factor, and the back-calculated
original concentration. **If the instrument were counting correctly, that last column would be
constant across dilutions of the same sample. It is not.**

**Three independent samples were each put through the same dilution series**, in duplicate at
every step. Back-calculated nuclei/mL in the original, averaged over each duplicate pair:

| Dilution | Sample 1 | Sample 2 | Sample 3 |
| --- | --- | --- | --- |
| 1:4 | 2.97 × 10⁶ | 2.66 × 10⁶ | 2.77 × 10⁶ |
| 1:8 | 4.23 × 10⁶ | 3.66 × 10⁶ | 3.09 × 10⁶ |
| 1:20 | 4.86 × 10⁶ | 6.11 × 10⁶ | 3.69 × 10⁶ |
| 1:100 | **1.75 × 10⁷** | **8.08 × 10⁶** | **9.50 × 10⁶** |
| 1:200 | — | 6.54 × 10⁶ | 7.14 × 10⁶ |

**The answer climbs with how much you diluted, in all three samples independently** — 5.9×,
3.0× and 3.4× respectively going from 1:4 to 1:100. That is the part to take seriously: it is
not one sample's bad series, it replicates.

Two further features of the same data:

- **The duplicates scatter badly.** Sample 1's two 1:8 readings differ 2-fold (2.80 vs
  5.66 × 10⁶); sample 3's two 1:200 readings differ 5-fold (1.19 × 10⁷ vs 2.38 × 10⁶). The
  trend is visible *through* substantial noise, not on top of a clean measurement.
- **1:200 breaks the trend and gets noisier.** In both samples that reached it, 1:200 came back
  *lower* than 1:100 — consistent with too few nuclei per field to count reliably. Somewhere
  around 1:100 the two error sources cross over.

An earlier version of this section reported sample 1 alone as "one sample, counted seven
times." Corrected 2026-08-20 after reading the full tab.

What this is consistent with — and it is an interpretation, not a scored result — is
**concentration-dependent under-counting**: at low dilution the nuclei are dense enough that the
instrument merges or misses them, and only the heavily diluted readings approach the true value.
That is the same direction as the 03.18.2026 note about the pellet looking bigger than the
count. It also means the least-diluted reading is the least trustworthy one.

Practical consequences until this is settled:

- **Do not count at a single dilution.** Step 5 specifies 1:8 and 1:50 for this reason; if the
  two disagree by more than ~2×, the number is not usable for dosing.
- **The 1:8 reading is likely an underestimate.** If you dose enzyme off it you will
  over-label — and over-labeling shows up as inferred nucleosome lengths shorter than the real
  ~150 bp, which you will not discover until after sequencing.
- **Nothing here establishes a correction factor.** The three samples disagree on the size of
  the effect (3.0× to 5.9×), so do not scale by 5×, or by anything else. The fix is an
  independent method, not a fudge factor.

> `[VERIFY: the direction replicates across three samples, but there is no orthogonal reference
> count anywhere in the record — every number in the tab comes from the same CellDrop. A
> hemocytometer or flow-cytometry cross-check on a single well-mixed prep, counted across the
> same 1:4 → 1:100 series, would settle the magnitude. It has never been done.]`

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Green or brown pellet, lots of debris | Too much starting tissue; incomplete filtering | Drop back toward 500 mg; check the strainer step actually ran to completion; add the optional extra NIB wash described in [[fiber-seq-hia5-labeling]] step 1 |
| Count implausible against pellet size | CellDrop under-counting (known, unresolved) | Treat the count as a lower bound; do not scale enzyme off it blindly — see § Nuclei counting |
| Two dilutions give very different counts | Concentration-dependent under-counting | Expected, not an error you made; the number is not usable for dosing if they disagree by more than ~2× |
| Nuclei will not fully submerge in the reaction volume | Too many nuclei for the volume | Flagged at the 12.3M half-scale test on 03.18.2026 — reduce input or scale the volume up |
| Low yield | Incomplete grinding, or thawing before lysis | Regrind; keep tissue frozen until buffer is added |

## Background — why this works

Fiber-seq needs **intact nuclei, not naked DNA**. The entire signal depends on chromatin
proteins still being bound so they can protect their footprints from Hia5, the m6A
methyltransferase. Everything in this protocol is in service of that.

What the buffer components do:

- **Sucrose (0.25 M)** — osmotic support, keeps nuclei from bursting.
- **Triton X-100 (1%)** — strips organellar and plasma membranes while leaving the nuclear
  envelope intact. This is what removes chloroplasts.
- **β-mercaptoethanol (5 mM)** — reducing agent against the phenolics that plant tissue
  releases on grinding.
- **Protease inhibitor (1×)** — keeps the chromatin proteins intact. Degrade them and you
  lose the footprints you are trying to measure.

Plant tissue is harder than cultured cells here because of the cell wall (needs cryogenic
grinding), chloroplasts, phenolics, and starch. The counting step is the weakest measurement
in the whole Fiber-seq chain.

## Notes, open questions and sources

**Page history.** Written 2026-08-18 from the lab's Fiber-seq development record. Reordered
2026-08-20 to put the procedure above the reference material. Counting section added
2026-08-20 from the *AnchorTag/RUN_NEW* spreadsheet, and corrected the same day after reading
the full `NUCLEI` tab: the dilution effect replicates across three samples, not one.

**Source.** Lab protocol from the *Fiber-Seq Experiments - Initial Tests* Google Doc,
*Protocol* tab, adapted from [PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2516708122).
CellDrop counts come from the Google Sheet *AnchorTag/RUN_NEW*, `NUCLEI` tab — read the
**lab-owned copy** in `Monroe Lab / Order/Inventory/Space / Protein Stocks`
([open](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit)),
snapshotted and verified against the original on 2026-08-20.
Background on why each step exists is in [[fiber-seq-master-protocol]].

**Input range provenance.** 500 mg to 3 g of tissue; both fresh and -80 °C frozen Col-0
seedlings have been used. PNAS 2025 uses ~500 mg of fresh tissue as its standard.

### Open questions

- `[VERIFY: hands-on time not recorded anywhere in the development log.]`
- `[VERIFY: which filtration route was actually used in the 05.2026 PBTS runs and the 06.2026
  tests. The Protocol tab says the two-step 70 µm → 30–40 µm route, but it predates those runs.]`
- `[VERIFY: has a nuclei counting method been settled since March 2026? A hemocytometer or
  flow-cytometry cross-check would close the CellDrop under-counting question. The dilution
  series in § Nuclei counting is the strongest evidence the lab has and it is still one sample,
  unreplicated across preps.]`
- `[VERIFY: the NUCLEI tab does not record which prep, date or tissue mass its counted samples
  came from — only a sample label. Tying that series to a specific isolation would let the
  count be compared against pellet size and yield.]`
- `[VERIFY: is the protoplast route worth testing, or deliberately not? Protoplasting is slow
  and species-specific, but it is what the published results were generated from.]`

**What the lab has and has not established.** Construct-by-construct verdicts for the Hia5
proteins used downstream are maintained in one place, on [[fiber-seq-master-protocol]]. Do not
duplicate them here.

## Resources and links

**Equipment:** [[automill]], [[celldrop]], [[centrifuge]]

**Reagents:** [[sucrose]], [[tris-base]], [[magnesium-chloride]], [[triton-x-100]], [[2-mercaptoethanol]], [[roche-protease-inhibitor-cocktail-edta-free]]

**Consumables:** [[macs-smartstrainer-30um]], [[cell-strainer-70um]], [[wide-bore-filter-tips-p1000]]

**Related Protocols:** [[fiber-seq-master-protocol]], [[fiber-seq-hia5-labeling]], [[cut-and-tag]]

**Contacts:** [[grey-monroe]]

**See also**

- [[fiber-seq-master-protocol]] — the hub, and where the Fiber-seq background lives
- [[fiber-seq-hia5-labeling]] — the next step
- [[cut-and-tag]] — the lab's other nuclei-based protocol, and the origin of the in-house isolation method
- [[fiber-seq-development-log]]
