---
type: "project"
title: "Pistachio Short-Read WGS"
status: "active"
pi: "Grey Monroe"
last_updated: "2026-04-29"
---

# Pistachio Short-Read WGS

Bulk Illumina short-read whole-genome sequencing of additional *Pistacia* trees beyond the [[pistachio-wolfskill-collection|Wolfskill]] WGS panel. Likely use cases: extending the GWAS / phenology variant atlas, additional imputation references for [[Pablo Luna Rodriguez]]'s [[Pacha]] pipeline, and short-read validation for [[pistachio-pangenome|Pistachio Pangenome]] HiFi assemblies. The 30 cards in this project use the `pt_short_<N>` naming convention.

## Summary

This project holds 30 accession cards numbered `pt_short_67` through `pt_short_96` — a contiguous numerical range that suggests `pt_short_1` through `pt_short_66` already exist elsewhere (probably under [[pistachio-wolfskill-collection|Wolfskill]] or a legacy data dump; verify when migrating). All 30 are *Pistacia* (genus only — species not yet pinned down per accession), all queued for Illumina WGS, all `Not yet received` as of 2026-04-29.

This is a placeholder project bucket for short-read pistachio sequencing that doesn't fit cleanly under Wolfskill, Kerman, PBTS, or Hybrids. As provenance / species data come in for the individual `pt_short_*` accessions, the cards should be migrated to the project where they belong, or this card should be expanded to describe the specific scientific purpose (e.g., a named GWAS panel).

## People

- **PI:** [[Grey Monroe]]
- Pangenome / Pacha-side analysis (likely consumer): [[Chaehee Lee]], [[Pablo Luna Rodriguez]], [[Matt Davis]]

## Sequenced samples

30 accessions, all `Pistacia`, all Illumina WGS, all `Not yet received`.

| Series | Sequencing | Count |
| --- | --- | --- |
| `pt_short_67` - `pt_short_96` | Illumina WGS | 30 |

Filter the [accession index](../accessions/index.md) by `project: "Pistachio Short-Read WGS"` for the live list.

## Resources

- [[Matt Davis]] · [[Chaehee Lee]] · [[Pablo Luna Rodriguez]]
- Master sample tracker: [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI/edit)
- Reference: phased Kerman ([[pistachio-pangenome|Pistachio Pangenome]]) — `Pvera_Kerman_RefGen_v1`

## Open questions

- Where `pt_short_1`-`pt_short_66` live (probably Wolfskill; verify).
- Per-accession species, provenance, and tree IDs (currently genus-level only).
- Scientific purpose of this batch — GWAS extension, ancestry inference, imputation reference, or general lab pool.

## Related

- [[pistachio-pangenome]]
- [[pistachio-wolfskill-collection]]
- [[pistachio-hybrids]]

#project #pistachio #pistacia #wgs #short-read #active
