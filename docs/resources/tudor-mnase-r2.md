---
type: enzyme
title: "Tudor-MNase, round 2 (MBP-fused)"
status: in_stock
vendor: GenScript
catalog_number: U4194NJYG0-6
lot: U4194NJYG0-9/P02LE001
location: ""
concentration: "1.82 mg/mL"
acquired: 2026-05-26
---

# Tudor-MNase, round 2 (MBP-fused)

**Tudor domain → MNase**, the CUT&RUN-style arm of round 2. Where the Hia5 fusions
*write* a mark on accessible DNA, this one *cuts*: the Tudor domain brings a micrococcal nuclease
to chromatin carrying the target histone mark, and the released fragments are what get sequenced.

> ℹ️ **This is a different experiment from Fiber-seq, not a different Hia5.** MNase is a nuclease.
> It does not methylate anything, it produces no m6A, and a DpnI gel will tell you nothing about
> it. Do not substitute it anywhere in [[fiber-seq-master-protocol]].

Never previously ordered by the lab — round 2 was its first appearance. It expressed far better
than either Hia5 construct in the same order: 1.82 mg/mL at ≥90% purity, 43.68 mg total.

> ℹ️ **Order and shipment — GenScript round 2**
>
> | Field | Value |
> | --- | --- |
> | Order / item | **U4194NJYG0**, item **-6** (design **C**) |
> | Lot | `U4194NJYG0-9/P02LE001` |
> | Quoted | 2026-04-23 · COA dated 05/19/2026 |
> | Shipped | 2026-05-26, FedEx 872241847658 |
> | Vector | pET30a |
> | Expression | *E. coli* **Arctic Express(DE3)** (BL21 Star(DE3) backup); 0.5 mM IPTG, **16 h at 18 °C** |
> | Purification | **Ni column only** — no Strep step this round |
> | Supplied as | **6 × 4.00 mL** |
> | PO / account | PrePurchasing #FJGM-ENPYYD2 · $5,399.38 for the order · PIN WUE5 |

> ℹ️ **QC as delivered**
>
> | Field | Value |
> | --- | --- |
> | Calculated MW | **68.372 kDa** (intact fusion, MBP still attached) |
> | Concentration | 1.82 mg/mL (Bradford) |
> | Total protein | 43.68 mg |
> | Purity (SDS-PAGE) | **≥90%** |

> ⚠️ **This protein was never cleaved.** MBP and the HRV 3C site are still attached. What is in
> the tube is the intact **68.372 kDa** fusion, not the ~26.7 kDa cleaved product the design
> targets. Every concentration and molarity below refers to the fusion.

> 💡 **Bench-recorded stock (`June2026` tab, purity-corrected)**
>
> | Field | Value |
> | --- | --- |
> | Effective concentration | 1.638 mg/mL (1.82 × 0.90) |
> | Molarity | **23,957.18 nM** |
> | ng/µL | 1,638 |
> | Vials logged | **6 × 4.00 mL** |
> | Working dilution | **2.44 µL protein + 197.56 µL storage buffer** (1:2 in the sheet's notation) |
>
> This is the fully worked-up entry the two Hia5 constructs are missing — vials counted, dilution
> calculated. It is ~7× the molarity of the Hia5 stocks.

## Status

**The only round-2 construct with a real bench history.** It carries no formal
pass/fail verdict, but unlike the Hia5 pair it was actually used.

The authoritative verdict table lives on [[fiber-seq-master-protocol]]. This page must not
contradict it — if you change a status, change it there first.

## Tests run

**06.04.2026 — stock validation, and the enzyme cut hard.**
[[Validate-MNase-Acitivty|Vianney's validation entry]] tested the new Tudor-MNase and
3ATudor-MNase stocks in a digestion time course: no MNase (1 h), then **1, 5, 10, 15, 30 and
60 min**. Enzyme loading ran across three levels — 1 µL of a **1:2 dilution** (top row), **1 µL
undiluted** (bottom lanes 2–8), and **2 µL undiluted** (bottom lanes 9–15) — with 5 µL of each
post-digestion sample on gel.

**Every MNase-treated lane came back empty**, both before cleanup and after a concentrating
cleanup (eluted in 20 µL, 5 µL loaded). Vianney's reading: *"perhaps all the DNA was cleaved
shorter <100 bp (last band in ladder)."* Her stated next steps were to **increase DNA input from
100 ng to 500 ng or 1 µg** and to **dilute the MNase**, with no need to test longer incubations.

That is a real result and a usable one: the enzyme is active, and at these settings it is *too*
active for the input. Read it for what it is, though — an **activity** check, not a **targeting**
check. It says nothing about whether the Tudor domain directs where the cutting happens.

**43 experiment rows** in the June 2026 `AnchorTag` log — by far the most-used
protein in the round — on 06/08, 06/11, 06/15 and 06/29 2026, against **Col-0** and **atx1/2/r7**
genotypes. The log records Tudor binding conditions, digestion conditions, reaction/wash buffer,
number of washes, enzyme input, enzyme units, nuclei input, and a nuclei(10⁶):enzyme-unit ratio for
each row.

No summary result, gel image, or written verdict from those runs has been located. The rows record
what was set up, not what came out.

> `[VERIFY: the outcome of the June 2026 Tudor-MNase series. 43 experiments were set up and the
> conditions are fully recorded, but no result, gel, or conclusion has been found in the run sheet,
> the vault, or Drive. Vianney Ahn's bench notebook and any sequencing submission from that window
> are the places to look.]`

## Sequence

**622 aa**, 68.372 kDa as the intact fusion. Verbatim from the annotated `.gp` record.

| Residues | Length | Region |
| --- | --- | --- |
| 1 | 1 aa | Start Met |
| 2–371 | 370 aa | **MBP** (mature) — solubility partner, **not cleaved off** |
| 372–381 | 10 aa | HRV 3C protease site (`SGLEVLFQ↓GP`) |
| 382–447 | 66 aa | **Tudor domain (wild type)** — targeting module |
| 448–467 | 20 aa | 4×(G₄S) linker |
| 468–616 | 149 aa | **MNase** — *Staphylococcus aureus* micrococcal nuclease (thermonuclease) |
| 617–622 | 6 aa | His₆ tag |

```
   1  MKIEEGKLVIWINGDKGYNGLAEVGKKFEKDTGIKVTVEHPDKLEEKFPQVAATGDGPDI
  61  IFWAHDRFGGYAQSGLLAEITPDKAFQDKLYPFTWDAVRYNGKLIAYPIAVEALSLIYNK
 121  DLLPNPPKTWEEIPALDKELKAKGKSALMFNLQEPYFTWPLIAADGGYAFKYENGKYDIK
 181  DVGVDNAGAKAGLTFLVDLIKNKHMNADTDYSIAEAAFNKGETAMTINGPWAWSNIDTSK
 241  VNYGVTVLPTFKGQPSKPFVGVLSAGINAASPNKELAKEFLENYLLTDEGLEAVNKDKPL
 301  GAVALKSYEEELAKDPRIAATMENAQKGEIMPNIPQMSAFWYAVRTAVINAASGRQTVDE
 361  ALKDAQTRITKSGLEVLFQGPTYGDEVVGKQVRVYWPLDKKWYDGSVTFYDKGEGKHVVE
 421  YEDGEEESLDLGKEKTEWVVGEKSGDRGGGGSGGGGSGGGGSGGGGSATSTKKLHKEPAT
 481  LIKAIDGDTVKLMYKGQPMTFRLLLVDTPETKHPKKGVEKYGPEASAFTKKMVENAKKIE
 541  VEFDKGQRTDKYGRGLAYIYADGKMVNEALVRQGLAKVAYVYKPNNTHEQHLRKSEAQAK
 601  KEKLNIWSEDNADSGQHHHHHH
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

- [C_MBP-HRV3C-Tudor-MNase-6His.gp](https://drive.google.com/file/d/1XcsgonAKqkaglbkzlSHkpADnounPFC6v/view) — annotated GenBank-format protein record, **source of the sequence above**
- [Expression report U4194NJYG0-1~16, 05/05/2026](https://drive.google.com/file/d/1KD0mZHv0G5mjaFi28_1w-aOgk9w3vbzO/view)
- [Quote U4194NJYG0](https://drive.google.com/file/d/1DY9sOOgC4A_SKXE2iMAxmNokajsEH0T2/view)
- [AnchorTag_RUN_NEW, lab copy](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit) — `June2026` inventory tab, `AnchorTag` experiment log

**Sequence provenance was checked, not assumed.** The molecular weight computed residue-by-residue
from the `.gp` record matches GenScript's COA MW to three decimal places (68.372 vs 68.372 kDa),
which confirms the record describes the protein that actually shipped.

> ⚠️ **COA lot numbers index differently from order item numbers** (-1↔-4, -11↔-14, -6↔-9,
> -16↔-19). When matching a document to a construct, **match on the construct name, not the
> number.**

## See also

- [[tudor-hia5-r2]] · [[3atudor-hia5-r2]] — the Hia5 arm of the same order
- [[hia5-protein-stocks]] — combined stock reference for both GenScript orders
- [[fiber-seq-master-protocol]] — the construct verdict table, single source of truth for status
- [Anchor Tag](../projects/anchor-tag/index.md) — the project these constructs belong to
- [[epicypher-cutana-hia5]] — the validated commercial Hia5 these are measured against
