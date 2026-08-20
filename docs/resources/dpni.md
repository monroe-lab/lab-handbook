---
type: enzyme
title: "DpnI"
status: needs_more
vendor: New England Biolabs
catalog_number: R0176
---

# DpnI

Restriction enzyme that recognizes **GATC** but cuts **only when the adenine in that site
carries an N6-methyl group**. That conditional behavior is what makes it a reagent rather than
just a cutter: on otherwise identical DNA, digestion is a direct binary readout of whether an
adenine methyltransferase was active.

This is the entire basis of [[dpni-methylation-check]], the lab's gel readout for whether a
DNA sample carries m6A, and of [[hia5-enzyme-activity-test]], which uses that readout to ask
whether a Hia5 or Hia5-fusion protein methylates at all.

> ℹ️ **Chemistry**
>
> Recognition site GATC; requires Dam-type N6-methyladenine at the A. Unmethylated GATC is not
> cut. Supplied by NEB as #R0176, used with [[rcutsmart-buffer]].
>
> `[VERIFY: which pack size the lab stocks — R0176S (small) vs R0176L (large). NEB's product
> pages block automated fetching, so only the base catalog number R0176 is confirmed. Check the
> tube in the enzyme freezer box.]`

> 💡 **Lab use**
>
> Read the gel, not the enzyme: **smear/laddering = methylation succeeded; intact band =
> the methyltransferase did nothing.** Always run an unmethylated no-enzyme control on the same
> gel, because a failed digest and a failed methylation look identical without it.
>
> The assay tests **methylation only**. It says nothing about whether a targeted fusion
> construct binds its intended target — that requires a separate DiMeLo-seq-style experiment.

## See also

- [[dpni-methylation-check]] — the assay this enzyme drives
- [[hia5-enzyme-activity-test]] — the enzyme test that assay reads out
- [[rcutsmart-buffer]] — the digestion buffer
- [[fiber-seq-master-protocol]]
