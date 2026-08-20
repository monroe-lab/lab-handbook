---
type: enzyme
title: "EpiCypher CUTANA Hia5"
status: needs_more
vendor: EpiCypher
catalog_number: 15-1032
---

# EpiCypher CUTANA Hia5

Commercial, purified **Hia5** N6-adenine methyltransferase, sold by EpiCypher specifically for
Fiber-seq. This is the lab's **working reference enzyme** — the one used when the question is
"did the assay work," as opposed to the in-house [Anchor Tag](../projects/anchor-tag/index.md)
fusion constructs, whose whole
point is to add targeting on top of this activity.

Used by [[fiber-seq-hia5-labeling]] and, as the known-good control, by
[[hia5-enzyme-activity-test]].

> ℹ️ **Product facts**
>
> | Field | Value |
> | --- | --- |
> | Catalog | 15-1032-8rxn ($495) / 15-1032-24rxn ($1,295) |
> | Molecular weight | 33.8 kDa |
> | Storage buffer | 50 mM Tris pH 8.0, 1 mM DTT, 250 mM NaCl, 10% glycerol |
> | Storage | -80 °C; stable 6 months from receipt |
> | Supplied as | 30X concentrate — **2 µL per 60 µL reaction** |
> | Molar concentration | **Not disclosed by the vendor** |

> 💡 **Lab use**
>
> Because EpiCypher does not publish a molar or mass concentration, this enzyme is **dosed by
> volume, not by molarity** — 2 µL per 1 M nuclei in the lab's labeling reaction. That is why
> the in-house construct comparison table in [[fiber-seq-master-protocol]] lists "Not stated"
> for the EpiCypher rows: there is nothing to compare against. Do not attempt to normalize
> in-house constructs to this enzyme on a molar basis.

> ⚠️ **Handling**
>
> Six-month stability from receipt is short for an enzyme that sits in a -80 °C box between
> experiments. Date the tube on arrival. Aliquot rather than freeze-thawing the stock.

## See also

- [[fiber-seq-master-protocol]] — the hub protocol
- [[fiber-seq-hia5-labeling]] — where it is used
- [[hia5-enzyme-activity-test]] — the in vitro activity check
- [[dpni-methylation-check]] — the gel readout
- [[hia5-protein-stocks]] — the in-house constructs this enzyme is the control for
- [[s-adenosylmethionine]] — the required methyl donor
