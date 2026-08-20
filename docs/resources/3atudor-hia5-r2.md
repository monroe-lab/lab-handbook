---
type: enzyme
title: "3ATudor-Hia5, round 2 (MBP-fused)"
status: in_stock
vendor: GenScript
catalog_number: U4194NJYG0-11
lot: U4194NJYG0-14/P02LE001
location: ""
concentration: "0.41 mg/mL"
acquired: 2026-05-26
---

# 3ATudor-Hia5, round 2 (MBP-fused)

The **matched negative control** for [[tudor-hia5-r2]]. Same MBP-Tudor-Hia5
architecture, with three aromatic residues in the Tudor binding pocket mutated to alanine so the
domain can no longer read its histone mark.

> ⚠️ **“3A” means binding-pocket knockout.** It is a specificity control, **not** a linker variant
> or an improved design, and it must never be used as a design template. The three substitutions
> are at **W396A, Y403A, Y421A** — confirmed by direct comparison with the wild-type record, which
> differs at exactly those three positions and nowhere else across all 756 residues.

> ℹ️ **Order and shipment — GenScript round 2**
>
> | Field | Value |
> | --- | --- |
> | Order / item | **U4194NJYG0**, item **-11** (design **E**) |
> | Lot | `U4194NJYG0-14/P02LE001` |
> | Quoted | 2026-04-23 · COA dated 05/19/2026 |
> | Shipped | 2026-05-26, FedEx 872241847658 |
> | Vector | pET30a |
> | Expression | *E. coli* **Arctic Express(DE3)** (BL21 Star(DE3) backup); 0.5 mM IPTG, **16 h at 18 °C** |
> | Purification | **Ni column only** — no Strep step this round |
> | Supplied as | **5 × 4.00 mL** |
> | PO / account | PrePurchasing #FJGM-ENPYYD2 · $5,399.38 for the order · PIN WUE5 |

> ℹ️ **QC as delivered**
>
> | Field | Value |
> | --- | --- |
> | Calculated MW | **84.210 kDa** (intact fusion, MBP still attached) |
> | Concentration | 0.41 mg/mL (Bradford) |
> | Total protein | 8.20 mg |
> | Purity (SDS-PAGE) | **≥65%** |
> | Note from GenScript | Claire Fan, 2026-05-12: *"protein Round2_A… (item-1) and
> Round2_E… (item-11) shows slightly lower purity due to partial fragmentation."* Grey declined a
> second purification round. |

> ⚠️ **This protein was never cleaved.** MBP and the HRV 3C site are still attached. What is in
> the tube is the intact **84.210 kDa** fusion, not the ~41.2 kDa cleaved product the design
> targets. Every concentration and molarity below refers to the fusion.

> 💡 **Bench-recorded stock (`June2026` tab, purity-corrected)**
>
> | Field | Value |
> | --- | --- |
> | Effective concentration | 0.2665 mg/mL (0.41 × 0.65) |
> | Molarity | **3,164.71 nM** |
> | ng/µL | 266.5 |
> | Vials logged | **none** |
> | Working dilution | **none recorded** |
>
> Note that the purity-corrected molarity lands within ~5% of [[tudor-hia5-r2]] (3,164.71 vs
> 3,313.26 nM). Unlike round 1, this control and its wild type are genuinely well matched — dosing
> them equivalently should be straightforward.

## Status

**Same reported-but-unscored status as its wild-type partner, and a negative
control regardless.** Never a candidate for production Fiber-seq by design. Its job is to show that
whatever signal [[tudor-hia5-r2]] produces depends on Tudor binding.

The authoritative verdict table lives on [[fiber-seq-master-protocol]]. This page must not
contradict it — if you change a status, change it there first.

## Tests run

**None recorded.** Same situation as [[tudor-hia5-r2]] — no gel, no assay, no bench
log rows. It should be run in parallel with the wild type whenever that test finally happens; a
Tudor-Hia5 result without this control alongside it does not establish targeting.

## Sequence

**756 aa**, 84.210 kDa as the intact fusion. Verbatim from the annotated `.gp` record.

| Residues | Length | Region |
| --- | --- | --- |
| 1 | 1 aa | Start Met |
| 2–371 | 370 aa | **MBP** (mature) — solubility partner, **not cleaved off** |
| 372–381 | 10 aa | HRV 3C protease site (`SGLEVLFQ↓GP`) |
| 382–447 | 66 aa | **3A Tudor domain** — binding-pocket knockout (W396A, Y403A, Y421A) |
| 448–467 | 20 aa | 4×(G₄S) linker |
| 468–750 | 283 aa | **Hia5** — N6-adenine DNA methyltransferase |
| 751–756 | 6 aa | His₆ tag |

```
   1  MKIEEGKLVIWINGDKGYNGLAEVGKKFEKDTGIKVTVEHPDKLEEKFPQVAATGDGPDI
  61  IFWAHDRFGGYAQSGLLAEITPDKAFQDKLYPFTWDAVRYNGKLIAYPIAVEALSLIYNK
 121  DLLPNPPKTWEEIPALDKELKAKGKSALMFNLQEPYFTWPLIAADGGYAFKYENGKYDIK
 181  DVGVDNAGAKAGLTFLVDLIKNKHMNADTDYSIAEAAFNKGETAMTINGPWAWSNIDTSK
 241  VNYGVTVLPTFKGQPSKPFVGVLSAGINAASPNKELAKEFLENYLLTDEGLEAVNKDKPL
 301  GAVALKSYEEELAKDPRIAATMENAQKGEIMPNIPQMSAFWYAVRTAVINAASGRQTVDE
 361  ALKDAQTRITKSGLEVLFQGPTYGDEVVGKQVRVYAPLDKKWADGSVTFYDKGEGKHVVE
 421  AEDGEEESLDLGKEKTEWVVGEKSGDRGGGGSGGGGSGGGGSGGGGSMANQNTFKQAPLP
 481  FIGQKRMFLKQFEQILNENISDNGEGWTILDTFGGSGLLSHTAKRLKPKARVIYNDFDGY
 541  AERLAHIDDINQLRAELYSVVGNATSKNKRMTKDCKAECIRIIQNFKGYKDLNCLASWLL
 601  FSGQQVATLDDLFQHNFWHCIRQSDYPKADGYLDGVEIVKESFHTLLPKFSNDPKALFVL
 661  DPPYLCTKQESYKQATYFDLIDFLRLVNITRPPYVFFSSTKSEFIRFVNYMLEDKVDNWQ
 721  AFENAKRITVNAKLNYQVAYEDNLVYKFLEHHHHHH
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

- [E_MBP-HRV3C-3ATudor-Hia5-6His.gp](https://drive.google.com/file/d/1-sjv299UXL0aZlqaBq5AwiwMSn0JTwcX/view) — annotated GenBank-format protein record, **source of the sequence above**
- [Expression report U4194NJYG0-1~16, 05/05/2026](https://drive.google.com/file/d/1KD0mZHv0G5mjaFi28_1w-aOgk9w3vbzO/view)
- [Quote U4194NJYG0](https://drive.google.com/file/d/1DY9sOOgC4A_SKXE2iMAxmNokajsEH0T2/view)
- [AnchorTag_RUN_NEW, lab copy](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit) — `June2026` inventory tab, `AnchorTag` experiment log

**Sequence provenance was checked, not assumed.** The molecular weight computed residue-by-residue
from the `.gp` record matches GenScript's COA MW to three decimal places (84.210 vs 84.210 kDa),
which confirms the record describes the protein that actually shipped.

> ⚠️ **COA lot numbers index differently from order item numbers** (-1↔-4, -11↔-14, -6↔-9,
> -16↔-19). When matching a document to a construct, **match on the construct name, not the
> number.**

## See also

- [[1-1-sometimes-hia5-enzyme-activity-test-in-vitro]] — the DpnI activity assay this construct still needs
- [[dpni-methylation-check]] — the gel readout
- [[tudor-hia5-r1]] — the round-1 version that failed to express
- [[hia5-protein-stocks]] — combined stock reference for both GenScript orders
- [[fiber-seq-master-protocol]] — the construct verdict table, single source of truth for status
- [Anchor Tag](../projects/anchor-tag/index.md) — the project these constructs belong to
- [[epicypher-cutana-hia5]] — the validated commercial Hia5 these are measured against
