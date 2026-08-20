---
type: enzyme
title: "pA-Hia5 (GenScript round 1)"
status: in_stock
vendor: GenScript
catalog_number: U9375BAEG0-8
lot: U9375BAEG0-8/P19KL001
location: ""
concentration: "0.04 mg/mL"
acquired: 2026-01-06
---

# pA-Hia5 (GenScript round 1)

**Protein A** fused to **Hia5**. Protein A binds the Fc region of IgG, so the design
intent is antibody-directed methylation: bring an antibody to a chromatin target, and the fused
MTase writes m6A locally rather than everywhere.

This is one of the two best-expressing Hia5 constructs in round 1 — 0.04 mg/mL at ≥95% purity, a
completely different situation from the free and Tudor constructs in the same order.

> ℹ️ **Order and shipment — GenScript round 1**
>
> | Field | Value |
> | --- | --- |
> | Order / item | **U9375BAEG0**, item **-8** |
> | Lot | `U9375BAEG0-8/P19KL001` |
> | Order report | 12/23/2025 |
> | Shipped | 2026-01-06, FedEx 887640539453, ship temp -80 °C |
> | Expression | *E. coli*, 0.2 L culture |
> | Purification | **Ni column + Strep column** |
> | Storage buffer | 50 mM Tris-HCl, 150 mM NaCl, 10% glycerol, pH 8.0 |
> | Supplied as | 3 mL per tube, **2 tubes** |
> | PO / account | UCDPO00232099 · $6,417.05 for all 10 items · G5512511 / PIN 3E48 |

> ℹ️ **QC as delivered**
>
> | Field | Value |
> | --- | --- |
> | Calculated MW | **52.735 kDa** |
> | Concentration | 0.04 mg/mL |
> | Total protein | 0.24 mg |
> | A260/A280 | 0.797 |
> | Purity (SDS-PAGE, reducing) | **≥95%** |
> | Endotoxin / nuclease | Order-level nuclease test 12/22/2025: *"No endonuclease and exonuclease activity"* |

> ⚠️ **The nuclease test is not an activity assay.** It says the prep is not contaminated with
> stray nucleases. It says nothing about whether this construct methylates DNA. The only
> activity readout the lab has is the DpnI assay — see § Tests run.

## Status

**Project-stage; no individual verdict recorded.** Good protein, untested claim.

The authoritative verdict table lives on [[fiber-seq-master-protocol]]. This page must not
contradict it — if you change a status, change it there first.

## Tests run

**Run on the 03.30.2026 DpnI panel as series B — outcome never written down.**

The [[fiber-seq-development-log]] entry dated **03.30.2026**, headed *"Validate rest
of the Hia5 proteins,"* is the experiment. Design: **100 ng HMW DNA per reaction, DpnI digest,
three incubation times (5 min / 20 min / 1 hr)**, run against a matched Epicypher CUTANA Hia5
series (E1–E3) plus two no-MTase controls. Four constructs were on the panel — free Hia5 (A),
pA-Hia5 (B), Tudor-Hia5 (C), 3ATudor-Hia5 (D). This construct is **series B** (B1, B2, B3).

It is the one round-1 Hia5 construct that combines a real antibody-recruitment design with good
expression (0.04 mg/mL, ≥95% purity), and its dose in the `Jan2026 - 2` calculator is a clean
**0.89 µL** for the 0.034 µg mass — under 5% of the reaction volume, so essentially no buffer
carryover confound. If any round-1 construct deserves a re-run first, it is this one.

Does not appear in the June 2026 `AnchorTag` bench log.

> `[VERIFY: the outcome of the 03.30.2026 DpnI panel. The dev log ends the section with two bare
> headings — `Gel 1:` and `Gel 2 (re-run w/ more DNA; sample 1 omitted from gel):` — and nothing
> under either. It also points at an **"Activity Test" tab** of the protein run sheet, and no tab
> by that name exists in the lab's copy (its tabs are `June2026`, `Jan2026`, `Jan2026 - 2`,
> `AnchorTag`, `NUCLEI`). The gel images and Vianney Ahn's bench notebook are the places to look.]`

> 💡 **How this construct was dosed in the 03.30.2026 run**
>
> The `Jan2026 - 2` tab is the calculation sheet behind that experiment. It carries a column
> headed `for 0.034ng`, annotated one row above as **`(eq. of 0.5ul pAG-Hia5)`** — the dose was
> pegged to half a microlitre of pAG-Hia5 and every other construct scaled to match it **by
> mass**. The unit is really µg: 0.5 µL × 0.068 mg/mL = 34 ng.
>
> | Construct | Purity | Working conc (mg/mL) | nM stock | µL for the 0.034 dose | µL for 25 nM in 20 µL |
> | --- | --- | --- | --- | --- | --- |
> | Hia5 | N/A, i.e. **<30%** (est. 29%) | 0.0029 **(upper bound)** | 81.69 | 11.72 | 6.12 |
> | pA-Hia5 | ≥95% | 0.038 | 720.58 | 0.89 | 0.69 |
> | pAG-Hia5 | ≥85% | 0.068 | 1133.28 | **0.50** | 0.44 |
> | Tudor-Hia5 | N/A, i.e. **<30%** (est. 29%) | 0.0029 **(upper bound)** | 65.33 | **11.72** | 7.65 |
> | 3ATudor-Hia5 | ≥70% | 0.028 | 635.04 | **1.21** | 0.79 |
>
> Because the dose was normalised by mass, the ~10× spread in the nM column is **not** a
> difference in delivered enzyme. The confound that survives is purity, not molarity — see
> [[1-1-sometimes-hia5-enzyme-activity-test-in-vitro]].

## Sequence

**467 aa**, 52.735 kDa. Full construct as ordered, verbatim from the GenScript Clone
Strategy sheet.

| Residues | Length | Region |
| --- | --- | --- |
| 1–2 | 2 aa | Start Met + Pro (cloning scar) |
| 3–144 | 142 aa | Protein A — IgG-binding domains |
| 145–164 | 20 aa | 4×(G₄S) linker |
| 165–445 | 281 aa | **Hia5** — N6-adenine DNA methyltransferase |
| 446–447 | 2 aa | LE linker |
| 448–453 | 6 aa | His₆ tag |
| 454–459 | 6 aa | SSGSSG linker |
| 460–467 | 8 aa | Strep-tag II (WSHPQFEK) |

```
   1  MPSLKDDPSQSANLLSEAKKLNESQAPKADNKFNKEQQNAFYEILHLPNLNEEQRNGFIQ
  61  SLKDDPSQSANLLAEAKKLNDAQAPKADNKFNKEQQNAFYEILHLPNLTEEQRNGFIQSL
 121  KDDPSVSKEILAEAKKLNDAQAPKGGGGSGGGGSGGGGSGGGGSMANQNTFKQAPLPFIG
 181  QKRMFLKQFEQILNENISDNGEGWTILDTFGGSGLLSHTAKRLKPKARVIYNDFDGYAER
 241  LAHIDDINQLRAELYSVVGNATSKNKRMTKDCKAECIRIIQNFKGYKDLNCLASWLLFSG
 301  QQVATLDDLFQHNFWHCIRQSDYPKADGYLDGVEIVKESFHTLLPKFSNDPKALFVLDPP
 361  YLCTKQESYKQATYFDLIDFLRLVNITRPPYVFFSSTKSEFIRFVNYMLEDKVDNWQAFE
 421  NAKRITVNAKLNYQVAYEDNLVYKFLEHHHHHHSSGSSGWSHPQFEK
```

## Location and aliquots

**Not recorded.** No Monroe Lab freezer location, aliquot count, or aliquot date has ever been
written down for any vial from either GenScript order. When the vials are found and logged, set
the `location` field in this page's frontmatter and fill in the table.

| Date | Who | Action | Vials | Where |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

> ⚠️ GenScript's paperwork carries a **shipping box map** (Box 1/2 and Box 2/2, positions A1–B5).
> That is where the vials sat inside the dry-ice shipper, **not** where they are in the lab. Do
> not copy it into the `location` field.

## Notebooks and linked records

- [[fiber-seq-development-log]] — Vianney Ahn's Anchor Tag / Fiber-seq development log,
  where the DpnI activity panels are written up
- [[Validate-MNase-Acitivty|Validate MNase Activity, 06.04.2026]] — the round-2 MNase stock check
- Bench dates and per-reaction conditions live in the `AnchorTag` tab of the run sheet, linked
  under § Sources.

_Add links here as work with this construct gets written up._

## Sources

- [GenScript order report U9375BAEG0, 12/23/2025](https://drive.google.com/file/d/1I2tIU9xSnvfXoYInLPETmlu9qlres4dl/view)
- [U9375BAEG0 Order Summary](https://drive.google.com/file/d/1jf9ItxBNptQWgiC04vTICzEcxijYweiE/view) — MW, concentration, purity, buffer, tube counts
- [U9375BAEG0 Clone Strategy](https://drive.google.com/file/d/1VeozGt1cHjq3rLeqyp45I2PHmE0GRd_7/view) — **source of the amino-acid sequence above**
- [Nuclease Test of U9375BAEG0, 12/22/2025](https://drive.google.com/file/d/1A7-9n76cZKUX3VsZAw5YHNasNWKpMuU6/view)
- [U9375BAEG0 Location Map](https://drive.google.com/file/d/1AEIJoPRVXKOSIOsJ8ZFsaXsehpJ_eqx4/view) — shipping box map only
- [AnchorTag_RUN_NEW, lab copy](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit) — `Jan2026` inventory tab, `Jan2026 - 2` dose calculator

**Sequence provenance was checked, not assumed.** The molecular weight computed residue-by-residue
from the Clone Strategy sequence matches GenScript's own reported MW on the Order Summary to three
decimal places, for all ten items in the order. The sequence above is the ordered construct.

## See also

- [[1-1-sometimes-hia5-enzyme-activity-test-in-vitro]] — the DpnI activity assay these constructs were run in
- [[dpni-methylation-check]] — the gel readout
- [[hia5-protein-stocks]] — combined stock reference for both GenScript orders
- [[fiber-seq-master-protocol]] — the construct verdict table, single source of truth for status
- [Anchor Tag](../projects/anchor-tag/index.md) — the project these constructs belong to
- [[epicypher-cutana-hia5]] — the validated commercial Hia5 these are measured against
