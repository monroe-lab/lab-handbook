---
type: enzyme
title: "Tudor-Hia5, round 2 (MBP-fused)"
status: in_stock
vendor: GenScript
catalog_number: U4194NJYG0-1
lot: U4194NJYG0-4/P02LE001
location: ""
concentration: "0.40 mg/mL"
acquired: 2026-05-26
---

# Tudor-Hia5, round 2 (MBP-fused)

Round-2 rebuild of the flagship Anchor Tag design: **Tudor domain → Hia5**, this time
carried on an **MBP solubility partner**. Round 1's [[tudor-hia5-r1]] barely expressed at all
(`<0.01` mg/mL, purity `N/A`); MBP was added specifically to fix that, and it worked — 0.40 mg/mL
and 9.60 mg total, roughly a 40× improvement in concentration.

The `.gp` record for this design notes that after HRV 3C cleavage the intended reagent is
`(GP)Tudor-Hia5-6His` at ~41.5 kDa, *"identical in size to round 1 construct U9375BAEG0-10 which
failed without a solubility partner."*

> ℹ️ **Order and shipment — GenScript round 2**
>
> | Field | Value |
> | --- | --- |
> | Order / item | **U4194NJYG0**, item **-1** (design **A**) |
> | Lot | `U4194NJYG0-4/P02LE001` |
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
> | Calculated MW | **84.509 kDa** (intact fusion, MBP still attached) |
> | Concentration | 0.40 mg/mL (Bradford) |
> | Total protein | 9.60 mg |
> | Purity (SDS-PAGE) | **≥70%** |
> | Note from GenScript | Claire Fan, 2026-05-12: *"protein Round2_A… (item-1) and
> Round2_E… (item-11) shows slightly lower purity due to partial fragmentation."* Grey declined a
> second purification round. |

> ⚠️ **This protein was never cleaved.** MBP and the HRV 3C site are still attached. What is in
> the tube is the intact **84.509 kDa** fusion, not the ~41.5 kDa cleaved product the design
> targets. Every concentration and molarity below refers to the fusion.

> 💡 **Bench-recorded stock (`June2026` tab, purity-corrected)**
>
> | Field | Value |
> | --- | --- |
> | Effective concentration | 0.280 mg/mL (0.40 × 0.70) |
> | Molarity | **3,313.26 nM** |
> | ng/µL | 280 |
> | Vials logged | **none** |
> | Working dilution | **none recorded** |
>
> The lab's own sheet applies the purity haircut before computing molarity — 0.40 mg/mL on the COA
> becomes 0.280 mg/mL here. Use the corrected number, and remember it still refers to the intact
> MBP fusion.

## Status

**Reported functional, never scored.** The sole basis is a hedged Slack DM from
Vianney Ahn on 2026-08-06. No gel, no assay result, no number exists in any lab record.

Two independent things point the same way. The `June2026` inventory tab has the vial-count and
working-dilution columns **filled in for the MNase pair and blank for both Hia5 constructs**. And
the June 2026 `AnchorTag` bench log has **70 experiment rows and not one Hia5 row** — 43
`Tudor-MNase`, 24 `3ATudor-MNase`, 3 `pAG-MNase`. The picture is that round-2 Hia5 arrived, went in
the freezer, and was never taken to the bench.

Not yet usable for production Fiber-seq. [[epicypher-cutana-hia5]] remains the only validated
option.

The authoritative verdict table lives on [[fiber-seq-master-protocol]]. This page must not
contradict it — if you change a status, change it there first.

## Tests run

**None recorded.** No DpnI assay, no gel, no activity measurement. The only claim in
existence is Vianney's 2026-08-06 Slack message, which is hedged and carries no data.

The obvious first experiment is a DpnI methylation check against EpiCypher CUTANA Hia5 as the
known-good control — see [[hia5-enzyme-activity-test]].

## Sequence

**756 aa**, 84.509 kDa as the intact fusion. Verbatim from the annotated `.gp` record.

| Residues | Length | Region |
| --- | --- | --- |
| 1 | 1 aa | Start Met |
| 2–371 | 370 aa | **MBP** (mature) — solubility partner, **not cleaved off** |
| 372–381 | 10 aa | HRV 3C protease site (`SGLEVLFQ↓GP`) |
| 382–447 | 66 aa | **Tudor domain (wild type)** — targeting module |
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
 361  ALKDAQTRITKSGLEVLFQGPTYGDEVVGKQVRVYWPLDKKWYDGSVTFYDKGEGKHVVE
 421  YEDGEEESLDLGKEKTEWVVGEKSGDRGGGGSGGGGSGGGGSGGGGSMANQNTFKQAPLP
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

- [A_MBP-HRV3C-Tudor-Hia5-6His.gp](https://drive.google.com/file/d/1tR8jHXetJ5KfP0SfZFqcE2TI17-6BWJz/view) — annotated GenBank-format protein record, **source of the sequence above**
- [Expression report U4194NJYG0-1~16, 05/05/2026](https://drive.google.com/file/d/1KD0mZHv0G5mjaFi28_1w-aOgk9w3vbzO/view)
- [Quote U4194NJYG0](https://drive.google.com/file/d/1DY9sOOgC4A_SKXE2iMAxmNokajsEH0T2/view)
- [AnchorTag_RUN_NEW, lab copy](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit) — `June2026` inventory tab, `AnchorTag` experiment log

**Sequence provenance was checked, not assumed.** The molecular weight computed residue-by-residue
from the `.gp` record matches GenScript's COA MW to three decimal places (84.510 vs 84.509 kDa),
which confirms the record describes the protein that actually shipped.

> ⚠️ **COA lot numbers index differently from order item numbers** (-1↔-4, -11↔-14, -6↔-9,
> -16↔-19). When matching a document to a construct, **match on the construct name, not the
> number.**

## See also

- [[hia5-enzyme-activity-test]] — the DpnI activity assay this construct still needs
- [[dpni-methylation-check]] — the gel readout
- [[tudor-hia5-r1]] — the round-1 version that failed to express
- [[hia5-protein-stocks]] — combined stock reference for both GenScript orders
- [[fiber-seq-master-protocol]] — the construct verdict table, single source of truth for status
- [Anchor Tag](../projects/anchor-tag/index.md) — the project these constructs belong to
- [[epicypher-cutana-hia5]] — the validated commercial Hia5 these are measured against
