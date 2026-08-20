---
type: enzyme
title: "pAG-Hia5 (GenScript round 1)"
status: in_stock
vendor: GenScript
catalog_number: U9375BAEG0-9
lot: U9375BAEG0-9/P19KL001
location: ""
concentration: "0.08 mg/mL"
acquired: 2026-01-06
---

# pAG-Hia5 (GenScript round 1)

**Protein A/G** fused to **Hia5**. The A/G hybrid broadens the range of antibody
species and isotypes that can be recruited compared with Protein A alone, which is why pAG is the
standard binder in commercial CUT&RUN-style reagents.

The highest-yielding Hia5 construct in round 1 at 0.08 mg/mL, ≥85% purity, 0.48 mg total. **It is
also the construct the whole round-1 dosing scheme was pegged to** — every other construct's volume
in the 03.30.2026 experiment was scaled to the mass in 0.5 µL of this one.

> ℹ️ **Order and shipment — GenScript round 1**
>
> | Field | Value |
> | --- | --- |
> | Order / item | **U9375BAEG0**, item **-9** |
> | Lot | `U9375BAEG0-9/P19KL001` |
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
> | Calculated MW | **60.003 kDa** |
> | Concentration | 0.08 mg/mL |
> | Total protein | 0.48 mg |
> | A260/A280 | 0.863 |
> | Purity (SDS-PAGE, reducing) | **≥85%** |
> | Endotoxin / nuclease | Order-level nuclease test 12/22/2025: *"No endonuclease and exonuclease activity"* |

> ⚠️ **The nuclease test is not an activity assay.** It says the prep is not contaminated with
> stray nucleases. It says nothing about whether this construct methylates DNA. The only
> activity readout the lab has is the DpnI assay — see § Tests run.

## Status

**Project-stage, and there is no written verdict for it anywhere** — not a
failure, not a pass. It served as the dosing reference rather than as a test article.

The authoritative verdict table lives on [[fiber-seq-master-protocol]]. This page must not
contradict it — if you change a status, change it there first.

## Tests run

**Tested twice, earlier than the others, and neither run has a recorded outcome.** Both are in the
[[fiber-seq-development-log]].

1. **Concentration series.** 50 ng HMW DNA per reaction, pAG-Hia5 at **25 nM (0.44 µL), 50 nM
   (0.88 µL) and 100 nM (1.76 µL)** (reactions A, B, C), each DpnI-digested, against an Epicypher
   CUTANA Hia5 series at 0.33 / 0.67 / 1 µL (D, E, F), plus a no-MTase + DpnI control.
2. **03.16.2026 time course.** 100 ng DNA, **0.5 µL of stock per reaction**, at **5 / 10 / 30 / 60
   / 90 min** (A–E), against a matched Epicypher series and both no-MTase controls.

No gel image or written conclusion follows either table. This construct is then **absent from the
03.30.2026 four-construct panel** — presumably because it had already been run, which fits the fact
that it became the dosing reference for that panel rather than a test article on it.

**It is the mass reference for the entire round-1 dosing scheme.** The `Jan2026 - 2` calculator's
`for 0.034ng` column is annotated `(eq. of 0.5ul pAG-Hia5)`, so every other construct's volume was
scaled to the 34 ng contained in half a microlitre of this stock.

A separate `pAG-MNase` appears on 3 rows of the June 2026 `AnchorTag` bench log. That is a
different protein, not this one.

> `[VERIFY: outcomes of the pAG-Hia5 concentration series and the 03.16.2026 time course. Both
> reaction tables are fully specified in the dev log with no result underneath. Gel images or
> Vianney Ahn's bench notebook are the places to look.]`

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
> [[hia5-enzyme-activity-test]].

## Sequence

**524 aa**, 60.003 kDa. Full construct as ordered, verbatim from the GenScript Clone
Strategy sheet.

| Residues | Length | Region |
| --- | --- | --- |
| 1–2 | 2 aa | Start Met + Pro (cloning scar) |
| 3–221 | 219 aa | Protein A/G — IgG-binding domains |
| 222–502 | 281 aa | **Hia5** — N6-adenine DNA methyltransferase |
| 503–504 | 2 aa | LE linker |
| 505–510 | 6 aa | His₆ tag |
| 511–516 | 6 aa | SSGSSG linker |
| 517–524 | 8 aa | Strep-tag II (WSHPQFEK) |

```
   1  MPSLKDDPSQSANLLSEAKKLNESQAPKADNKFNKEQQNAFYEILHLPNLNEEQRNGFIQ
  61  SLKDDPSQSANLLAEAKKLNDAQAPKADNKFNKEQQNAFYEILHLPNLTEEQRNGFIQSL
 121  KDDPSVSKEILAEAKKLNDAQAPKTTYKLVINGKTLKGETTTEAVDAETAERHFKQYAND
 181  NGVDGEWTYDDATKTFTVTEKPEVIDASELTPAVDDDKEFAMANQNTFKQAPLPFIGQKR
 241  MFLKQFEQILNENISDNGEGWTILDTFGGSGLLSHTAKRLKPKARVIYNDFDGYAERLAH
 301  IDDINQLRAELYSVVGNATSKNKRMTKDCKAECIRIIQNFKGYKDLNCLASWLLFSGQQV
 361  ATLDDLFQHNFWHCIRQSDYPKADGYLDGVEIVKESFHTLLPKFSNDPKALFVLDPPYLC
 421  TKQESYKQATYFDLIDFLRLVNITRPPYVFFSSTKSEFIRFVNYMLEDKVDNWQAFENAK
 481  RITVNAKLNYQVAYEDNLVYKFLEHHHHHHSSGSSGWSHPQFEK
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

- [[hia5-enzyme-activity-test]] — the DpnI activity assay these constructs were run in
- [[dpni-methylation-check]] — the gel readout
- [[hia5-protein-stocks]] — combined stock reference for both GenScript orders
- [[fiber-seq-master-protocol]] — the construct verdict table, single source of truth for status
- [Anchor Tag](../projects/anchor-tag/index.md) — the project these constructs belong to
- [[epicypher-cutana-hia5]] — the validated commercial Hia5 these are measured against
