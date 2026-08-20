---
type: enzyme
title: "Hia5 Protein Stocks (in-house, GenScript)"
status: in_stock
vendor: GenScript
---

# Hia5 Protein Stocks (in-house, GenScript)

**Hia5 is the methyltransferase (MTase)** — a bacterial non-sequence-specific N6-adenine DNA
methyltransferase that writes m6A onto accessible adenines using SAM as the methyl donor. It is
the catalytic module in every construct on this page. (The other enzyme it is always paired
with, [[dpni|DpnI]], is a restriction enzyme that *detects* m6A; it never writes it.)

Every in-house Hia5 and Hia5-fusion protein the lab has had made, across two GenScript orders.
This is the reference for concentration, purity, molecular weight, and what each construct
actually is. For the commercial reference enzyme see [[epicypher-cutana-hia5]]; for what has
and has not been tested see [[hia5-enzyme-activity-test]].

Project context: [Anchor Tag](../projects/anchor-tag/index.md).

> ⚠️ **Read this before doing molar arithmetic.**
>
> - The **nM figures below are computed from total protein**, not from active enzyme. A stock
>   at <30% purity dosed at "50 nM" delivers well under 50 nM of Hia5. Back-calculating MW
>   from the lab's own conc/nM columns returns the full construct masses (35.5 / 52.7 / 60.0 /
>   44.4 / 44.1 kDa), which is how we know the column is not purity-corrected.
> - **Round-2 proteins were never cleaved.** The MBP and the HRV 3C site are still attached.
>   What is in the tube is the intact ~84.5 kDa (Hia5) or ~68.4 kDa (MNase) fusion, **not** the
>   ~41.5 / ~26.7 kDa post-cleavage protein. Any molarity computed from the post-cleavage mass
>   is off by roughly 2×.
> - **"3A" is a binding-pocket knockout, not a linker variant.** Comparing the delivered
>   round-2 sequences for items -1 and -11 shows exactly three aromatic→alanine substitutions
>   in the Tudor domain (`QVRVYWPL`→`QVRVY**A**PL`, `DKKWYDGS`→`DKKW**A**DGS`,
>   `VVEYEDG`→`VVE**A**EDG`) and no other difference. It is the **negative control** for
>   histone binding. Its methylation activity is expected to be normal and tells you nothing
>   about the wild-type construct.

## Round 1 — GenScript order U9375BAEG0

Order report 12/23/2025, shipped 2026-01-06 (FedEx 887640539453), PO UCDPO00232099, total
$6,417.05, GenScript account G5512511 / PIN 3E48.

Common to all round-1 items: *E. coli* based system, 0.2 L expression volume, Ni column +
Strep column purification, storage buffer **50 mM Tris-HCl, 150 mM NaCl, 10% glycerol,
pH 8.0**, 3 mL per tube, 2 tubes per item.

| Item | Construct | MW (kDa) | Conc (mg/mL) | A260/280 | Purity | Total (mg) |
| --- | --- | --- | --- | --- | --- | --- |
| -7 | (AA)Hia5-6His | 35.502 | <0.01 | 2.129 | N/A | <0.06 |
| -8 | (AA)pA-Hia5-6His | 52.735 | 0.04 | 0.797 | ≥95% | 0.24 |
| -9 | (AA)pAG-Hia5-6His | 60.003 | 0.08 | 0.863 | ≥85% | 0.48 |
| -10 | (AA)Tudor-Hia5-6His | 44.391 | <0.01 | 0.275 | N/A | <0.06 |
| -1 | (AA)3ATudor-Hia5-6His | 44.092 | 0.04 | 0.768 | ≥70% | 0.24 |

GenScript's footnote, verbatim: *"'N/A' indicates that the purity is less than 30%."*
So items -7 and -10 are **not** unmeasured — they are below the reporting floor. Sophie Yang,
2026-02-06: *"items 7 and 10 exhibit very low expression, almost none."*

The round-1 tags are **His6 plus Strep-tag II** — every delivered sequence ends
`...LEHHHHHHSSGSSGWSHPQFEK`. The "-6His" in the construct names is incomplete for round 1.
Lot numbers follow the pattern `U9375BAEG0-N/P19KL001`.

> **GenScript's box positions are a shipping map, not a freezer location.** The order report
> assigns Box 2/2 A3–B5 and Box 1/2 A1–A2 to these items. That describes how they arrived.
> `[VERIFY: no Monroe-lab freezer location, aliquot count, or aliquot date has ever been
> recorded for any Hia5 vial from either round. This is the single biggest gap on this card.]`

### Bench-recorded concentrations (03.06.2026)

The values the lab actually used when setting up the March 2026 assays:

| Name | Conc (mg/mL) | Purity (%) | nM stock |
| --- | --- | --- | --- |
| Hia5 | 0.0029 | <30 | 81.69 |
| pA-Hia5 | 0.038 | 95 | 720.58 |
| pAG-Hia5 | 0.068 | 85 | 1133.28 |
| Tudor-Hia5 | 0.0029 | <30 | 65.33 |
| 3ATudor-Hia5 | 0.028 | 70 | 635.04 |

> **These are derived numbers, not measurements — treat 0.0029 mg/mL as an upper bound.**
> The `Jan2026` tab of *AnchorTag/RUN_NEW* carries the two footnotes that generate them,
> verbatim: *"For samples with purity of NA, they indicate any purity that is less than 30%
> --> used 29% as estimate"* and *"for samples with conc listed as 0.01mg/ml, they are actually
> <0.01; removed < for calculations."* So 0.0029 = 0.01 × 0.29, where **both** inputs are
> ceilings: the true concentration is below 0.01 mg/mL and the true purity is below 30%. The
> real active-enzyme concentration is lower than 0.0029 mg/mL by an unknown factor, possibly a
> large one.
>
> That also explains why free Hia5 and Tudor-Hia5 carry the *identical* 0.0029 / <30 pair —
> not a placeholder copied across, but the same formula applied to the same two ceiling values,
> because GenScript reported both constructs identically.

> **The nM column is a stock concentration, not a delivered dose.** The `Jan2026 - 2` tab
> converts these stocks into per-reaction volumes that deliberately cancel the 10× spread —
> 11.72 µL of Tudor-Hia5 against 1.21 µL of 3ATudor-Hia5, both landing on 0.034 µg. An earlier
> version of this page said Tudor-Hia5 "ran at roughly one tenth the molarity of its own
> control"; that read the stock column as the dose and is **retracted (2026-08-20)**. The real
> confound is purity, not molarity — see [[hia5-enzyme-activity-test]] § *Two things that
> complicate the 03.30 Tudor-Hia5 verdict*.

The two asterisked rows in the source table carry the footnote *"omitted for now, due to lack
of protein stock…"* — meaning they were left out of the **03.06.2026** titration, not that they
were never tested. Both were run on 03.30.2026. Do not read the asterisk as a permanent
exclusion.

### Nuclease clearance, not activity

GenScript's 12/22/2025 nuclease test returned *"No endonuclease and exonuclease activity"* for
all ten round-1 items. **This is a contamination clearance. It is not a methyltransferase
activity assay** and says nothing about whether any of these proteins works.

`[VERIFY: the nuclease-test PDF has swapped 3.1 / 3.2 section headings and a summary claiming
"<10%" that conflicts with its own Table 10 entry of "-30%". Do not quote figures out of it
without re-reading the tables.]`

## Round 2 — GenScript order U4194NJYG0

Quoted 2026-04-23, COAs dated 05/19/2026, shipped 2026-05-26 (FedEx 872241847658),
$5,399.38, PrePurchasing #FJGM-ENPYYD2, PIN WUE5.

Vector pET30a, Arctic Express(DE3) primary / BL21 Star(DE3) backup, 0.5 mM IPTG, 16 h at
18 °C, **Ni column only**. Architecture: `Protein Length = 756 aa; MBP: 4-367; HRV 3C
protease site: 374-381; His6: 751-756`. Genuine bare His6 — no Strep tag this round.

| Item | Construct | Lot | MW (kDa) | Conc | Amount | Purity | Vials |
| --- | --- | --- | --- | --- | --- | --- | --- |
| -1 | Round2_A_MBP-HRV3C-Tudor-Hia5-6His | U4194NJYG0-4/P02LE001 | 84.509 | 0.40 mg/mL (Bradford) | 9.60 mg | ≥70% | 6 × 4.00 mL |
| -11 | Round2_E_MBP-HRV3C-3ATudor-Hia5-6His | U4194NJYG0-14/P02LE001 | 84.210 | 0.41 mg/mL | 8.20 mg | ≥65% | 5 × 4.00 mL |
| -6 | Round2_C_MBP-HRV3C-Tudor-MNase-6His | U4194NJYG0-9/P02LE001 | 68.372 | 1.82 mg/mL | 43.68 mg | ≥90% | 6 × 4.00 mL |
| -16 | Round2_F_MBP-HRV3C-3ATudor-MNase-6His | U4194NJYG0-19/P02LE001 | 68.072 | 1.74 mg/mL | 41.76 mg | ≥90% | 6 × 4.00 mL |

Claire Fan, 2026-05-12: *"protein Round2_A… (item-1) and Round2_E… (item-11) shows slightly
lower purity due to partial fragmentation."* Grey declined a second purification round on
GenScript's warning that it could increase degradation.

### Bench-recorded round-2 stocks (`June2026` tab, AnchorTag/RUN_NEW)

The lab's own working-up of the four round-2 tubes. Unlike the GenScript table above, these
figures are **purity-corrected**: `conc × purity` gives the "effective" column, and the nM
figures are computed from that, against the **intact fusion** MW (MBP still attached).

| Construct | MW (kDa) | Conc (mg/mL) | Total (mg) | Purity | Effective conc (mg/mL) | nM stock | ng/µL | Vials logged | Working dilution logged |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Round2_A_MBP-HRV3C-Tudor-Hia5-6His | 84.509 | 0.40 | 9.6 | 70% | 0.280 | 3,313.26 | 280 | — | — |
| Round2_E_MBP-HRV3C-3ATudor-Hia5-6His | 84.210 | 0.41 | 8.2 | 65% | 0.2665 | 3,164.71 | 266.5 | — | — |
| Round2_C_MBP-HRV3C-Tudor-MNase-6His | 68.372 | 1.82 | 43.68 | 90% | 1.638 | 23,957.18 | 1,638 | 6 × 4.00 mL | 2.44 µL protein + 197.56 µL storage buffer (1:2) |
| Round2_F_MBP-HRV3C-3ATudor-MNase-6His | 68.072 | 1.74 | 41.76 | 90% | 1.566 | 23,005.05 | 1,566 | 6 × 4.00 mL | 2.55 µL protein + 197.45 µL storage buffer (1:2) |

> **The two Hia5 rows were never worked up.** Both the vial-count and the working-dilution
> columns are filled in for the MNase pair and **blank for the Hia5 pair**. Pair that with the
> `AnchorTag` experiment log in the same workbook — **70 rows** carrying a Sample ID, dated
> 06/08, 06/11, 06/15 and 06/29 2026, reading `Tudor-MNase` on 43, `3ATudor-MNase` on 24 and
> `pAG-MNase` on 3, **zero Hia5 rows** — and the picture is that
> round-2 Hia5 arrived, went in the freezer, and was never taken to the bench. This is the
> documentary basis for the *reported functional, never scored* verdict on
> [[fiber-seq-master-protocol]].
>
> `[VERIFY: GenScript's paperwork records 6 vials for Round2_A and 5 for Round2_E; the lab
> sheet records none. Absence of a logged count is not evidence the vials are missing — but
> nobody has confirmed they are in the freezer either. Count them.]`

Even at round 2's much improved yield, a Hia5 fusion tube is **~5.9× more dilute by mass**
(0.280 vs 1.638 mg/mL effective) and **~7.2× more dilute molar** (3,313 vs 23,957 nM) than an
MNase tube from the same order. That gap is the downstream consequence of the expression
penalty documented below, and it is why a Hia5 reaction cannot simply reuse an MNase dilution
scheme.

`[VERIFY: the COA lot numbers index differently from the order item numbers (-1↔-4, -11↔-14,
-6↔-9, -16↔-19). Both appear in GenScript's own paperwork. Match on construct name, not on
number, when pulling a vial.]`

### The expression penalty is in the Hia5 moiety

From GenScript's expression report
(`U4194NJYG0-1-~16_Expression report_Customized in E.coli_05052026.pdf`):

| Fusion | Arctic Express(DE3) | BL21 Star(DE3) | Solubility |
| --- | --- | --- | --- |
| **Hia5** fusions (A, E) | **5 mg/L** | **5 mg/L** | ~70% |
| **MNase** fusions (C, F) | **100–130 mg/L** | **100–130 mg/L** | — |

**A 20–26× expression penalty specific to the Hia5 half, reproducible across two strains and
unaffected by MBP fusion.** This single number explains the entire yield and purity gap
between the Hia5 and MNase constructs — and by extension the round-1 failures, which had no
solubility partner at all. Plan any future Hia5 order around 5 mg/L, not around what the MNase
constructs returned.

### QC that was purchased vs QC that was not

The QC ordered from GenScript for round 2 was **SDS-PAGE and Western blot only** (quote items
5 / 10 / 15 / 20). **No functional or methyltransferase assay was ever ordered.** The decision
is recorded in the vault verbatim: *"Functional activity QC done in-house, not requested from
GenScript."*

That in-house test was set up on 06.14.2026 and never scored. See
[[hia5-enzyme-activity-test]] § Round 2 for what the record does and does not support.

## Ordering contacts

GenScript account **G5512511**. Project managers over time: Sophie Yang and Annie Fan
(round 1 and the round-2 quote), Claire Fan (round-2 QC and shipping).

## Sources

**The GenScript paperwork is now filed in Drive.** It used to exist only as Gmail attachments;
on 2026-08-20 it was pulled out and filed under
`Monroe Lab / Order/Inventory/Space / Protein Stocks`:

- **[GenScript U9375BAEG0 — round 1 Hia5](https://drive.google.com/drive/folders/1itEKdxC--p8gxotMPqIX_Tlhm8W5Azss)**
  (5 files) — order report, nuclease test, order summary, clone strategy, location map.
- **[GenScript U4194NJYG0 — round 2 MBP fusions](https://drive.google.com/drive/folders/1rf8tK58JlVViJEoFJV6sO1TV-oIwQrPp)**
  (11 files) — all four COAs, the expression report, the SDS-PAGE/Western QC deck, the quote,
  and the four delivered `.gp` sequence files.

> **The round-2 COAs were read and checked against this page on 2026-08-20.** Round2_A and
> Round2_E match on every field the table above quotes — MW, concentration, amount, purity,
> vial count, lot number, storage buffer, Ni-column-only purification, and the
> `756 aa; MBP 4-367; HRV 3C 374-381; His6 751-756` architecture. The odd **5-vial** count for
> Round2_E against 6 for the others is confirmed by its COA, not a transcription error.

Sources: GenScript order reports, COAs, expression report and nuclease test for orders
U9375BAEG0 (round 1) and U4194NJYG0 (round 2), plus correspondence with Sophie Yang, Annie Fan
and Claire Fan. Bench-recorded concentrations, the round-2 working-up and the footnotes on how
the sub-floor values were computed come from the Google Sheet *AnchorTag/RUN_NEW*, tabs
`Jan2026` and `June2026`. Cite the **lab-owned copy**, `AnchorTag_RUN_NEW (lab copy of
Vianney's, 2026-08-20)`, in `Monroe Lab / Order/Inventory/Space / Protein Stocks`:
[open](https://docs.google.com/spreadsheets/d/16YT_2reiyBNsnpwCbjCaFuVPBMVdYS8eX3SZL6LWZcw/edit).
Every figure on this page was verified identical between the original and the copy on
2026-08-20. The original is on [[vianney-ahn|Vianney]]'s UC Davis account and still active —
**the copy is a snapshot, not a mirror.**

Updated 2026-08-20 with the round-2 bench table and the derivation of the round-1 sub-floor
concentrations. The `nM stock` column was **not** the delivered dose; a claim built on that
reading was retracted the same day (see the note under the round-1 table).

## See also

- [[hia5-enzyme-activity-test]] — how to test a lot before using it
- [[dpni-methylation-check]] — the gel readout
- [[epicypher-cutana-hia5]] — the commercial reference enzyme
- [[fiber-seq-master-protocol]] — the hub, and the maintained construct verdict table
- [Anchor Tag](../projects/anchor-tag/index.md) — the fusion construct project
