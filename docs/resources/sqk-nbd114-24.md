---
type: kit
title: Native Barcoding Kit 24 V14 (SQK-NBD114.24)
status: needed
vendor: Oxford Nanopore
catalog_number: SQK-NBD114.24
---

# Native Barcoding Kit 24 V14 (SQK-NBD114.24)

Ligation-based multiplexed nanopore library prep kit (~$700, 6 preps per kit, 24 barcodes per prep). This is the correct kit for any application where the **output read length must faithfully reflect the input molecule length**, including PacBio HiFi shearing QC, native HMW gDNA QC, plasmid verification, amplicon ID, methylation screening, and short-read library QC on a Flongle.

The chemistry is end-repair → dA-tail → per-sample native barcode ligation → pool → AMPure cleanup → sequencing adapter ligation → final AMPure cleanup. Every step preserves the ends of the DNA molecule — **no cutting**. Read length equals molecule length.

> **DO NOT confuse with SQK-RBK114.24** (Rapid Barcoding Kit V14). That kit uses **transposase tagmentation** which cuts and tags DNA in a single step; the output read length reflects transposase activity, not input size. It is the **wrong chemistry** for any size-faithful sequencing application. The Monroe Lab briefing originally recommended RBK114 by mistake; this was corrected. Always order NBD, not RBK, for the in-house HiFi QC workflow.

Used in [[in-house-hifi-shearing]] via [[nbd114-multiplexed-flongle-prep]] (manual fallback) and [[ot2-automated-nbd114-prep]] (OT-2 automated default). Requires the [[nebnext-companion-module-ont]] (or standalone NEB end-prep + ligase modules) for the enzymes not shipped in the ONT kit itself.

[Store page](https://store.nanoporetech.com/native-barcoding-kit-24-v14.html) · [Protocol](https://community.nanoporetech.com/docs/prepare/library_prep_protocols/ligation-sequencing-v14-native-barcoding-kit-24/)
